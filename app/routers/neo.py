from py2neo import Graph
import logging
import os
import json
from neo4j.exceptions import ServiceUnavailable
from fastapi import FastAPI, Request, Form, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.responses import RedirectResponse

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

#Neo4j connection 
N4J_USER = os.environ.get('NEO4J_USER')
N4J_PASS = os.environ.get('NEO4J_PASS')

class Neo:
    def __init__(self, uri, user, password):
        self.driver = Graph(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def search(self, query: str, twoperson = False):
        print('Driver: ', self.driver)
        with self.driver.session(database="neo4j") as session:
            try:
                results = session.read_transaction(
                    lambda tx: tx.run(query).data()
                                    )

                self.driver.close()
                return results
            except Exception as e:
                logging.error("{query} raised an error: \n {exception}".format(query=query, exception=e))
                raise e

            


try:

    neo_db = Graph("bolt://localhost:7687/neo4j", auth=(N4J_USER , N4J_PASS))
    query = '''MATCH (a:person{fullname: $sender}) - [e:EMAILED_TO] -> (b:person)
      MATCH (a:person) - [s:SENT] -> (m:message)
      RETURN m.date as date, m.messageId as messageId, a.fullname AS sender,
       b.fullname as receiver, m.subject as subject LIMIT 10;
    '''
    results = neo_db.run(query, parameters={"sender": "John Arnold"}).data()
    print(results[0])
except Exception as e:
    print(f'failed to load: {e}')

    
@router.get("/graph", response_class=HTMLResponse)
def form_get(request: Request):
    # return RedirectResponse(url='http://localhost:7474/browser/')
    return templates.TemplateResponse('neovis.html', context={'request': request})


@router.get("/timeline", response_class=HTMLResponse)
def form_get(request: Request):
    # print('serving from neo.py...')
    # driver = Journey("bolt://localhost:7687/neo4j", N4J_USER, N4J_PASS)
    # cypher_query = '''MATCH (a:person) - [r] -> (m:message)
    # RETURN a.fullname, a.email, TYPE(r) as Type, count(*) as count, m.date as date ORDER BY date;
    # '''
    # results = driver.search(cypher_query)
    # print(results[:3])
    # result = "Type a number"
    return templates.TemplateResponse('timeline.html', context={'request': request})



@router.get('/get-station')
async def get_station():
    return neo_db.find_all()

@router.get('/get-journey')
async def get_journey(start: str, end: str, count: int):
    result = neo_db.find_journey(start, end, count)
    
    journey = []
    
    # loop over the result, each row contains path and weight
    for row in result:
        paths = []
        # used to store the last node information for synchronization
        last_node_id = -1
        last_node_mrt = "x"

        for path in row['path']:
            # get all the nodes in the path
            nodes = [n for n in path.nodes]

            # append the result if it is the first node, mostly for visualization purpose
            if(last_node_id == -1):
                id = 0
                if(nodes[0]['name'] != start):
                    id = 1
                paths.append({"name": nodes[id]['name'].title(), "mrt": nodes[id]['mrt'], "time": "start here"})
                last_node_id = nodes[id].id
                last_node_mrt = nodes[id]['mrt']

            # flag to determine is we should use the first element or the second element as they are marked by id and might not be in order
            id = 0
            if(last_node_id != nodes[1].id):
                id = 1

            # use information from the previous node if it is an interchange
            mrt = nodes[id]['mrt']
            if(nodes[id]['mrt'] == 'x'):
                mrt = last_node_mrt

            paths.append({"name": nodes[id]['name'].title(), "mrt": mrt,"time": "%s minutes" % (path['time'])})
            last_node_id = nodes[id].id
            last_node_mrt = mrt
        journey.append({"path": paths, "weight": row['weight']})

    return journey
