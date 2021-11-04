function drawNeovis(cypher_query) {
    try {
    var config = {
        container_id: "neoviz",
        server_url: "bolt://localhost:7687/neo4j",
        server_user: "fitz",
        server_password: "enron425",
        labels: {
            
            "person": {
                caption: "fullname",
                community: "red",
            },
            "message": {
                caption: "subject"
            }
        },
        relationships: {
            "EMAILED_TO": {

                thickness: "messageCount"
            }
        },
        initial_cypher: "MATCH (a:person)-[r]->(b:person) RETURN a,r,b LIMIT 100"
    }

    if (cypher_query) {
        config.initial_cypher = cypher_query
    }

    console.log('retrieving cypher: ', config.initial_cypher)

    var viz = new NeoVis.default(config);
    viz.render();
    } catch(error) {
        console.error('Error loading Neovis: ', error);
    }
}