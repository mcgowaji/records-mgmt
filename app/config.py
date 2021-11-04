import os

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    ELASTICSEARCH_URL = os.environ.get('ELASTICSEARCH_URL') 