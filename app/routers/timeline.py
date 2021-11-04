from fastapi import FastAPI, Request, Form, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from datetime import date
from py2neo import Graph
import os
import time
from .splitview import makeSummary, neo_db

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/timeline", response_class=HTMLResponse)
async def form_get(request: Request):
    timeline_cypher = '''
    MATCH (a:person) - [r] -> (m:message)
    WHERE datetime({year: 2001, month: 9}) < m.date <= datetime({year: 2001, month: 12})
    WITH collect(TYPE(r)) as directions, m.date.year as year, m.date.month as month, m.date.day as day
    RETURN size([x in directions WHERE x = 'SENT']) as sent, 
    size([x in directions WHERE x = 'RECEIVED']) as received, 
    year, month, day
    ORDER BY year, month, day;
    '''
    try:
        results = neo_db.run(timeline_cypher).data()
        return templates.TemplateResponse('timeline.html', context={'request': request, "results": results})

    except Exception as e:
        print(e)
        return "Exception :("


@router.post("/timeline")
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


    timeline_cypher = (
    "MATCH (a:person) - [e:EMAILED_TO] -> (b:person) "
    "WHERE a.fullname CONTAINS coalesce($sender, a.fullname) AND b.fullname CONTAINS coalesce($receiver, b.fullname) "
    "WITH a, b "
    "MATCH (a) - [r] -> (m:message) "
    "WHERE datetime({year: $startyear, month: $startmonth, day: $startday}) < m.date <= datetime({year: $endyear, month: $endmonth, day: $endday}) "
    "WITH collect(TYPE(r)) as directions,  m.date.year as year ,m.date.month as month, m.date.day as day "
    "RETURN year, month, day, "
    "size([x in directions WHERE x = 'SENT']) as sent, "
    "size([x in directions WHERE x = 'RECEIVED']) as received "
    "ORDER BY year, month, day LIMIT 30;"
    )

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
        results = neo_db.run(timeline_cypher, parameters = params).data()
        finish = time.time()
        print(f'finished query in {finish - start} seconds.')
        
        return templates.TemplateResponse(
            'timeline.html', 
            context={
                "request": request, 
                "results": results
                })

    except Exception as e:
        print(f'failed to execute neo4j script: {e}.')
        return f'failed to execute neo4j script: {e}.'