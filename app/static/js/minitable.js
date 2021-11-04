function drawTable(data) {
    console.log('first processed tableRow: ', data[0]);
    const parseDate = (d) => {
         const dt = d.get('date'),
         year = dt['year']['low'], 
         month = dt['month']['low'], 
         day = dt['day']['low']; 

        const date = new Date(
        year,
        month - 1, // neo4j dates start at 1, js dates start at 0
        day,
        );

        return date;
    };

    const makeSummary = d => {

        const sender = d.get('sender', 'sender'),
            receiver = d.get('receiver', 'receiver'),
            subject = d.get('subject');
            ans = sender + '-> ' + receiver + ': ' + subject;

        return ans;
    }

    // const driver = neo4j.driver(
    //     "bolt://localhost:7687/neo4j", 
    //     neo4j.auth.basic('fitz', 'enron425')
    //     )
    //   const session = driver.session({database:"neo4j"})
      // const cypher = `
      // MATCH (a:person) - [e:EMAILED_TO] -> (b:person)
      // MATCH (a:person) - [s:SENT] -> (m:message)
      // RETURN m.date as date, m.messageId as messageId, a.fullname AS sender,
      //  b.fullname as receiver, m.subject as subject LIMIT 20;
      //  ` 
        
    
    // session
    //   .run(cypher)
    //   .then(function (data, error) {
    //     if (error) throw error;

    //     const records = data.records;
    //     console.log(records[0])
    //     var data = records.map((d, i) => {
    //         var p = {};
    //         p.messageId = d.get('messageId');
    //         p.Date = parseDate(d);
    //         p.Summary = makeSummary(d);
    //         return p;
    //       });
    

        var sortAscending = true;
        var outerTable = d3.select('#minitable-wrap');

        // var headers = outerTable.append("tr")
        //     .append("td")
        //     .append("table")
        //     .attr("class", "headerTable")
        //     .append('thead')
        //     .attr('class', 'thead-dark')
        //     .append('tr')
        //     .selectAll('th')
        //     .data(titles).enter()
        //     .append('th')
        //     .text(function (d) {
        //         return d;
        //     })
        //     .on('click', function (d) {
        //         headers.attr('class', 'header');
                
        //         if (sortAscending) {
        //             rows.sort(function(a, b) { return b[d] < a[d]; });
        //             sortAscending = false;
        //             this.className = 'aes';
        //         } else {
        //             rows.sort(function(a, b) { return b[d] > a[d]; });
        //             sortAscending = true;
        //             this.className = 'des';
        //         }
                
        //     });
        
        var innerTable = outerTable
            .append("div").attr("class", "scroll")
            .append("table")
            .attr("class", "bodyTable");   
        var rows = innerTable.append('tbody')
            .selectAll('tr')
            .data(data).enter()
            .append('tr')
            .append('td')
            .attr('class', 'td-flexible')
            .append("a")
            .attr('class', 'hyperlink')
            .attr("href", d => {
              // write function to convert messageId and find matching ElasticSearch ID
              return `../doc/${d.messageId}`
            })
            .text( d => d.Summary);
    // });
}
