import tqdm
import random
import joblib
import pandas as pd
import umap
import time
import hdbscan
from sentence_transformers import SentenceTransformer
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
from sklearn.metrics import silhouette_score
import numpy as np

def cluster_stats(x, y, clustered):
    #Summarize effectiveness of clustering
    print('Percentage of datapoints assigned to cluster: ', 
          100*np.sum(clustered) / x.shape[0]
         )
    print('Silhouette Score of new labelling: ', 
          silhouette_score(x, y)
         )
    print('Silhouette Score of nonnegative points: ', 
          silhouette_score(x[clustered], y[clustered])
         )

def plot_3d(x, y, hover = None):
    '''Plots 3d embedding with label clusters.
    Args: 
        x - 3d embedding
        y - labels
        hover - Series name: optional hover data added to figure.'''
    
    #Filter out points labelled as noise for viz
    clustered = (y >= 0)
    
    if hover is not None:

        toy = pd.DataFrame( 
            np.column_stack([x, y, hover])[clustered], 
            columns = ['x1', 'x2', 'x3', 'y', 'Synopsis']
        )

        fig = px.scatter_3d(
            toy, x='x1', y='x2', z='x3',
            color= 'y',
            hover_name = 'Synopsis',
            title = 'NTSB Incident Topics'
        )
        
        fig.update_layout(scene = dict(
                        xaxis = dict(
                             visible = False,
                            showbackground=False,
                            showticklabels = False,
                        ),
                        yaxis = dict(
                            visible = False,
                            showbackground=False,
                            showticklabels = False,
                        ),
                        zaxis = dict(
                            visible = False,
                            showbackground=False,
                            showticklabels = False,

                        )
                       ), 
#                       showlegend=False
                     )
    
        #Print summary stats
        cluster_stats(x, y, clustered)

        fig.show()
        
        return
            
    toy = pd.DataFrame( 
        np.column_stack([x[clustered], y[clustered]]), 
        columns = ['x1', 'x2', 'x3', 'y']
    )



    fig = px.scatter_3d(
        toy, x='x1', y='x2', z='x3',
        color= 'y',
        title = 'NTSB Incident Topics'
    )

    
    

    fig.update_layout(
        scene = dict(
            xaxis = dict(
                 visible = False,
                showbackground=False,
                showticklabels = False,
            ),
            yaxis = dict(
                visible = False,
                showbackground=False,
                showticklabels = False,
            ),
            zaxis = dict(
                visible = False,
                showbackground=False,
                showticklabels = False,
            )
        ), 
    )
    
    #Print summary stats
    cluster_stats(x, y, clustered)
        
    fig.show()
    
    


def get_cluster_centers(embedding, labels):
    '''Approximates centers of clusters, 
    assuming clusters are spherical using Euclidean distance.'''
    temp_df = np.column_stack([embedding, labels])
    temp_df = pd.DataFrame(temp_df, columns = ['x', 'y', 'z', 'Cluster'])
    
    return temp_df.groupby('Cluster').mean()


#Sample cluster pipeline
sample_embedding = umap.UMAP(
    n_neighbors=4,
    min_dist=0.0,
    n_components=20,
    random_state=42,
).fit_transform(vectors)

sample_labels = hdbscan.HDBSCAN(
    min_samples=2,
    min_cluster_size=3,
).fit_predict(sample_embedding)


samples = range(1, 11)
sizes = range(3, 31, 3)
results = []

    
#Gridsearch for best params
sizes = range(3, 31, 3)
samples = range(1, 11)
first_sample = 5
header = ['min_samples', 'min_cluster_size', 'sil_score']
results = []
start = time.time()
for size in sizes:
    for sample in samples:
        try:  
            
            enron_labels = hdbscan.HDBSCAN(
                min_cluster_size = size,
                min_samples = sample,
                memory = './hdbscan_cache/',
            ).fit_predict(enron_embedding)
            print(f'Working on sample={first_sample}, size={size}...')

            clustered = (enron_labels >= 0)
            noise_ratio = np.count_nonzero(clustered)  / len(clustered)
            score = silhouette_score(enron_embedding[clustered], enron_labels[clustered])
            agg_score = score**2 * noise_ratio

            results.append((sample, size, score, noise_ratio, agg_score))
        except ValueError as e:
            print(f'Encountered {e} at combination sample={sample} and size={size}.')
            pass

end = time.time()

#Use best results to test min_sample_size
results_df = pd.DataFrame(results, columns = ['min_samples', 'min_cluster_size', 'sil_score', 'noise_ratio', 'agg_score'])
best_size, best_sample = results_df.iloc[results_df.agg_score.argmax()][['min_cluster_size', 'min_samples']]
best_labels = hdbscan.HDBSCAN(
    min_cluster_size = int(best_size),
    min_samples = int(best_sample),
    memory = './hdbscan_cache/',
).fit_predict(enron_embedding)
print(f'total time elapsed: {end - start} seconds.')
print(f'found best size = {best_size} and best_sample = {best_sample}')

#Use best results from gridsearch
best_sample, best_size = results.iloc[results.sil_score.argmax()][['min_samples', 'min_cluster_size']]

final_labels = hdbscan.HDBSCAN(
    min_samples= best_sample,
    min_cluster_size = best_size
).fit_predict(enron_embedding)