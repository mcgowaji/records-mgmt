#Gridsearch for best params
import pandas as pd
import time
import hdbscan
import numpy as np
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import MinMaxScaler

#Gridsearch for best params
def make_clusters(embedding): 
    '''Takes  N x 3 matrix of embeddings and clusters while selecting optimal parameters.
    Balance is struck between including all points as noise and silhouette score of 
    existing clusters.'''
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
                ).fit_predict(embedding)

                clustered = (enron_labels >= 0)
                noise_ratio = np.count_nonzero(clustered)  / len(clustered)
                score = silhouette_score(embedding[clustered], enron_labels[clustered])
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
    ).fit_predict(embedding)
    
    print(f'found best size = {best_size} and best_sample = {best_sample}')
    scaler = MinMaxScaler()
    vecs_scaled = scaler.fit_transform(embedding)

    final = pd.DataFrame ( np.hstack((vecs_scaled, best_labels.reshape(-1, 1))), columns = ['x', 'y', 'z', 'Cluster'])
    print(f'total time elapsed: {end - start} seconds.')
    return final


#Word counts per cluster
def word_freqs(df):
    results = []
    for n in range(int(df.Cluster.max())):
        #Filter out all lines except this cluster
        section = df[df.Cluster == n]
        # Combine words into a long string
        long_string = ''.join([x for x in section.Synopsis])
        #save top 20
        top20 = sorted(Counter(long_string.split()).items(), key = itemgetter(1), reverse=True)[:20]
        for ans in top20:
            results.append((n, *ans))
            
    cols = ['cluster', 'text', 'frequency']
    results = sorted(results, key = itemgetter(0))
    return pd.DataFrame(results,columns=cols)


    