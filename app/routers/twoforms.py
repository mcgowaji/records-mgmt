from fastapi import FastAPI, Request, Form, APIRouter
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

class SplitSearch(BaseModel):
    yournumber1: int = None
    yournumber2: int = None
    extra: str = None

    # sender: Optional[str] = None
    # receiver: Optional[str] = None
    # startdate: Optional[date] =  None
    # enddate: Optional[date] =  None

@router.get("/twoforms", response_class=HTMLResponse)
def form_get(request: Request):
    result = "Type a number"
    return templates.TemplateResponse('twoforms.html', context={'request': request, 'result': result})

# number1: int = Form(...), number2: int = Form(...)
@router.post("/form1", response_class=HTMLResponse)
async def form_post1(request: Request):
    # print(f'number1 is {number1} and number2 is {number2}.')
    form = await request.form()
    print(form['number1'])
    return form['number1']
    # result = number1 + 2
    # return templates.TemplateResponse('twoforms.html', context={'request': request, 'result': result, 'yournum1': number1, 'yournum2': number2, 'extra': extra})


@router.post("/form2", response_class=HTMLResponse)
def form_post2(request: Request, number: int = Form(...)):

    result = number + 100
    return templates.TemplateResponse('twoforms.html', context={'request': request, 'result': result, 'yournum': number})
