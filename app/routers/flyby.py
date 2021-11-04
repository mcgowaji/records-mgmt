from fastapi import FastAPI, Request, Form, APIRouter
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
import pandas as pd
from fastapi import FastAPI
import os 
import logging

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")


# embedding = pd.read_csv(app.url_for('data', path='enron_embedding_sample.csv'))
# print(embedding.head())

@router.get("/flyby", response_class=HTMLResponse)
def form_get(request: Request):
    print('Directory: ', os.getcwd())
    print(dir(request))
    print(list(request.values()))
    logging.info('testing flyby.py page.')
    return templates.TemplateResponse('bubblechart.html', context={'request': request})

# @router.post("/flyby", response_class=HTMLResponse)
# def update_views(request: Request, q: str):
#     # form = await request.form()
#     # print(form)
   
#     data = pd.read_csv('data/enron_embedding_sample.csv')
#     data
#     flyby_df = make_clusters(data)

#     return templates.TemplateResponse('splitview.html', context={'request': request, 'flyby_df': flyby_df})