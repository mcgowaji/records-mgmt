from fastapi import FastAPI, Query, Request, Form, HTTPException, Depends
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
from typing import Dict, Optional, List
from enum import Enum
from pydantic import BaseModel
from elasticsearch import Elasticsearch
from fastapi_elasticsearch import ElasticsearchAPIQueryBuilder
from fastapi_elasticsearch.utils import wait_elasticsearch
from py2neo import Graph
import atexit
from fastapi.middleware.cors import CORSMiddleware
from app.routers import unsplash, twoforms, neo, timeline, splitview, flyby
from app.library.helpers import clean_address, es_search
import aiohttp
import datetime
from fastapi.encoders import jsonable_encoder
from elasticsearch import AsyncElasticsearch, NotFoundError
from elasticapm.contrib.starlette import ElasticAPM, make_apm_client
import sys
import os

# class Response(BaseModel):
#     _index: str
#     _type: Optional[str] = None
#     _id: float
#     _version: Optional[str] = None
#     __seq_no: Optional[str] = None
#     _primary_term: Optional[str] = None
#     _found: Optional[str] = None
#     _source: Optional[str] = None


#Neo4j connection 
# N4J_USER = os.environ.get('NEO4J_USER')
# N4J_PASS = os.environ.get('NEO4J_PASS')

# neo_db = Graph("bolt://localhost:7687/neo4j", auth=(N4J_USER , N4J_PASS))

# def exit_application():
#     neo_db.close()

# atexit.register(exit_application)

#App initialization
app = FastAPI()

app.include_router(timeline.router)
app.include_router(twoforms.router)
app.include_router(neo.router)
app.include_router(splitview.router)
app.include_router(flyby.router)

templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static", html=True), name="static")
app.mount("/data", StaticFiles(directory="app/data", html=True), name="data")

@app.get("/", response_class=RedirectResponse)
async def redirect():
    response = RedirectResponse(url="/index")
    return response


@app.get("/page/{page_name}", response_class=HTMLResponse)
async def page(request: Request, page_name: str):
    data = {
        "page": page_name
    }
    return templates.TemplateResponse("results.html", {"request": request, "data": data})


apm = make_apm_client(
    {
        "SERVICE_NAME": "fastapi-app",
        "SERVER_URL": "http://localhost:9200"
         }
)
es = AsyncElasticsearch(os.environ["ELASTICSEARCH_URL"])
index_name = 'enron'
# app = FastAPI()
app.add_middleware(ElasticAPM, client=apm)

origins = [
    "http://localhost:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def app_shutdown():
    await es.close()


@app.get("/index/")
async def search(request: Request):
    results =  await es.search(
        index=index_name, body = {
            'size' : 100,
            'query': {
                'match_all' : {}
            }
            }
    )

    fields = {'_Date':'Date', '_X-From':'From', '_X-To':'To', '_Subject': 'Subject'}
    results = results['hits']['hits']
    results = list(map(clean_address, results))
    # Clean Results before entering
    return templates.TemplateResponse('results.html', context={'request': request, 'results': results, 'fields': fields}
    )


@app.post("/search/", response_class=HTMLResponse)
async def search(request: Request, query: str = Form(...)):
    results, total = await es_search(es, query)
    
    fields = {'_Date':'Date', '_X-From':'From', '_X-To':'To', '_Subject': 'Subject', '_score':'Score'}

    return templates.TemplateResponse('results.html', 
        context={'request': request, 'fields': fields, 'results': results, 'query': query, 'total': total}
    )


@app.get("/delete")
async def delete():
    return await es.delete_by_query(index=index_name, body={"query": {"match_all": {}}})


@app.get("/delete/{id}")
async def delete_id(id):
    try:
        return await es.delete(index=index_name, id=id)
    except NotFoundError as e:
        return e.info, 404


@app.get("/update")
async def update():
    response = []
    docs = await es.search(
        index=index_name, body={"query": {"multi_match": {"query": ""}}}
    )
    now = datetime.datetime.utcnow()
    for doc in docs["hits"]["hits"]:
        response.append(
            await es.update(
                index=index_name, id=doc["_id"], body={"doc": {"modified": now}}
            )
        )

    return jsonable_encoder(response)


@app.get("/error")
async def error():
    try:
        await es.delete(index=index_name, id="somerandomid")
    except NotFoundError as e:
        return e.info


@app.get("/doc/{id}")
async def get_doc(request: Request, id: int):
    # fields = {'_X-From':'From', '_X-To':'To', '_Subject': 'Subject', '_score':'Score'}
    # result = await es.get(index=index_name, id=id)
    # doc_body = result['_source']['_body']
    result = await es.search(index=index_name, body = {
        "query" : {
            "term" : {
                "_Message-ID": id
            }
        }
    })
    doc_body = result['hits']['hits'][0]['_source']['_body']
    # return result
    return templates.TemplateResponse('results.html', context={'request': request, 'doc_body': doc_body})











