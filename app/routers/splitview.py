from fastapi import Request, Form, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from elasticsearch import AsyncElasticsearch
from py2neo import Graph
from pydantic import BaseModel
from datetime import date
import os
from typing import Optional
from ..library.helpers import es_search
import logging
import time


router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
es = AsyncElasticsearch(os.environ["ELASTICSEARCH_URL"])

logging.getLogger("urllib3").setLevel(logging.ERROR)

#Neo4j connection 
N4J_USER = os.environ.get('NEO4J_USER')
N4J_PASS = os.environ.get('NEO4J_PASS')

neo_db = Graph(scheme="bolt", host="localhost", auth=(N4J_USER , N4J_PASS))

def makeSummary(point):
    if point['subject'] is None:
        point['subject'] = 'N/A'

    sender = point.get('sender', 'sender')
    receiver = point.get('receiver', 'receiver')
    subject = point.get('subject', 'N/A')
    
    try:
        return sender + ' -> ' + receiver + ': ' + subject
    except Exception as e:
        print(f' {e} occured because of these variables: {sender} {receiver} {subject}.')




@router.get("/splitview", response_class=HTMLResponse)
def form_get(request: Request):

    table_cypher = '''
      MATCH (a:person) - [e:EMAILED_TO] -> (b:person)
      MATCH (a) - [s:SENT] -> (m:message)
      RETURN m.date as date, m.messageId as messageId, a.fullname AS sender,
      b.fullname as receiver, m.subject as subject LIMIT 20;
      '''

    timeline_cypher = '''
    MATCH (a:person) - [r] -> (m:message)
    WHERE datetime({year: 2001, month: 9}) < m.date <= datetime({year: 2001, month: 10})
    WITH collect(TYPE(r)) as directions, m.date.year as year, m.date.month as month, m.date.day as day
    RETURN size([x in directions WHERE x = 'SENT']) as sent, 
    size([x in directions WHERE x = 'RECEIVED']) as received, 
    year, month, day
    ORDER BY year, month, day LIMIT 30;
    '''

    neo_results = neo_db.run(table_cypher).data()
    timeline_results = neo_db.run(timeline_cypher).data()
    messageIds = [r.get('messageId') for r in neo_results]
    summaries = list(map(makeSummary, neo_results))
    neo_results = [{'summary': x, 'messageId': y} for x, y in zip(summaries, messageIds)]


    return templates.TemplateResponse('splitview.html', context={
        'request': request, 
        'neo_results': neo_results, 
        'timeline_results': timeline_results
        })


@router.post("/splitview")
async def update_views(request: Request):
    form_data = await request.form()
    start_year = date.fromisoformat(form_data["start-date"]).year
    start_month = date.fromisoformat(form_data["start-date"]).month
    start_day = date.fromisoformat(form_data["start-date"]).day
    end_year = date.fromisoformat(form_data["end-date"]).year
    end_month = date.fromisoformat(form_data["end-date"]).month
    end_day = date.fromisoformat(form_data["end-date"]).day
    sender = form_data.get("sender", None)
    receiver = form_data.get("receiver", None)
    print('sending and receiving', type(sender), type(receiver))


    table_cypher = (
    "MATCH (a:person) - [e:EMAILED_TO] -> (b:person)"
    " WHERE a.fullname CONTAINS coalesce($sender, a.fullname) AND b.fullname CONTAINS coalesce($receiver, b.fullname)"
    " WITH a, b"
    " MATCH (a) - [r] -> (m:message)"
    " WHERE datetime({year: $startyear, month: $startmonth, day: $startday}) < m.date <= datetime({year: $endyear, month: $endmonth, day: $endday})"
    " WITH collect(TYPE(r)) as directions, m.date.year as year, m.date.month as month, m.date.day as day,"
    " m.date as date, m.messageId as messageId, a.fullname AS sender,"
    " b.fullname as receiver, m.subject as subject"
    " RETURN size([x in directions WHERE x = 'SENT']) as sent,"
    " size([x in directions WHERE x = 'RECEIVED']) as received,"
    " year, month, day, messageId, sender, receiver, subject"
    " ORDER BY year, month, day LIMIT 1000;"
    )

    timeline_cypher = (
    "MATCH (a:person) - [e:EMAILED_TO] -> (b:person) "
    "WHERE a.fullname CONTAINS coalesce($sender, a.fullname) AND b.fullname CONTAINS coalesce($receiver, b.fullname) "
    "WITH a, b "
    "MATCH (a) - [r] -> (m:message) "
    # "WHERE datetime({year: $startyear, month: $startmonth, day: $startday}) < m.date <= datetime({year: $endyear, month: $endmonth, day: $endday}) "
    "WITH collect(TYPE(r)) as directions,  m.date.year as year ,m.date.month as month, m.date.day as day "
    "RETURN year, month, day, "
    "size([x in directions WHERE x = 'SENT']) as sent, "
    "size([x in directions WHERE x = 'RECEIVED']) as received "
    "ORDER BY year, month, day LIMIT 1000;"
    )

    neovis_cypher = f"MATCH (a:person) - [e:EMAILED_TO] -> (b:person) WHERE a.fullname CONTAINS coalesce('{sender}', a.fullname) AND b.fullname CONTAINS coalesce('{receiver}', b.fullname) WITH a, b MATCH (a) - [r] -> (m:message) RETURN a, r, b;"
    # f"WHERE datetime({year: $startyear, month: $startmonth, day: $startday}) < m.date <= datetime({year: $endyear, month: $endmonth, day: $endday}) "
    

    # MATCH (a:person) - [e:EMAILED_TO] -> (b:person)
    # WHERE a.fullname CONTAINS "g" AND b.fullname CONTAINS "John"
    # WITH a, b
    # MATCH (a:person) - [r] -> (m:message)
    # WHERE datetime({year: 2000, month: 8, day: 1}) < m.date <= datetime({year: 2001, month: 1, day: 30})
    # RETURN a, b, r;

    params = {
        "sender": sender,
        "receiver": receiver,
        "startyear" : start_year,
        "startmonth" : start_month,
        "startday" : start_day,
        "endyear" : end_year,
        "endmonth" : end_month,
        "endday" : end_day
    }

    try:
        start = time.time()
        neo_results = neo_db.run(table_cypher, parameters = params).data()
        middle = time.time()
        print(f'finished first query in {middle - start} seconds.')
        timeline_results = neo_db.run(timeline_cypher, parameters = params).data()
        finish = time.time()
        print(f'finished second query in {finish - middle} seconds.')
        print(f'Total time elapsed: {finish - start} seconds.')
        # add summary
        try: 
            summaries = list(map(makeSummary, neo_results))
            for ix, res in enumerate(neo_results):
                res.update({'summary': summaries[ix]})

            if len(neo_results) > 0:
                print('first row with summary: ', neo_results[0])

        except Exception as e:
            print(f'Error making summary: {e}')
        #Check summary additions
        
        return templates.TemplateResponse(
            'splitview.html', 
            context={
                "request": request, 
                "neo_results": neo_results,
                "timeline_results": timeline_results,
                "neovis_cypher": neovis_cypher,
                "params": params
                })

    except Exception as e:
        print(f'failed to execute neo4j script: {e}.')
        return f'failed to execute neo4j script: {e}.'