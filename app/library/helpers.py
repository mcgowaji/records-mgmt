import re



def clean_address(result):
    '''Ingests a dictionary, 
    cleans out outgoing and incoming email addresses,
    and returns the dict.
    In: dict - Elasticsearch result.
    Out - dict - Cleaned version w/o <> tags.'''
    fields = ['_X-From', '_X-To', '_body']
    if len(result['_source']['_Subject']) == 0:
         result['_source']['_Subject'] = 'N/A'
    for field in fields:
        result['_source'][field] = re.sub(r"@ENRON", "", result['_source'][field])
        result['_source'][field] = re.sub(r"<(.*?)>", "", result['_source'][field]).strip()
        if len(result['_source'][field]) > 50:
            result['_source'][field] = result['_source'][field][:50]+'...'
    return result


async def es_search(es, query):
    print('posting....')
    body = {
        "size" : 1000,
        "query": {
        "function_score": {
            "query": {
                "multi_match": {
                    "query": query,
                    "fields": ["_From", "_To", "_Subject",  "_body"],
                    "fuzziness" : "AUTO",
                    "prefix_length" : 2

                }
            }
        }
        },
       
    }

    try:
        results =  await es.search(
            index='enron', body=body
        )

        if len(results) == 0:
            return "Nothing found."
        
        total = results['hits']['total']['value']
        print(f'Total results: {total}')
        
        results = results['hits']['hits']
        results = list(map(clean_address, results))
        
        print(results[:2])
    except Exception as e:
        print('Error: ', e)
    
    fields = {'_Date':'Date', '_X-From':'From', '_X-To':'To', '_Subject': 'Subject', '_score':'Score'}

    return results, total