const wordpath = $("#wordpath").data().name;

var l_width = window.innerWidth / 6,
  l_height = 0.3 * window.innerHeight,
  margin = {
    top: l_height / 30,
    right: l_width / 4,
    bottom: l_height / 10,
    left: l_width / 3,
  };
// margin = {top: 10, right: 40, bottom: 40, left: 60};

// append the svg object to the body of the page
var svg = d3
  .select("#wordcloud")
  .append("svg")
  .attr("width", "100%")
  .attr("height", "100%")
  // .attr("width", l_width + margin.left + margin.right)
  // .attr("height", l_height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
// Add X axis
var x = d3.scaleLinear().range([0, l_width]);
var xAxis = svg.append("g").attr("class", "myXaxis").style("display", "none");

// Y axis
var y = d3.scaleBand().range([0, 300]).padding(1);

var yAxis = svg.append("g").attr("class", "myYaxis");

function update(cluster_num) {
  d3.csv(wordpath, d3.autoType).then((data) => {
    var data = data.filter((d) => d.cluster == cluster_num);
    // v5 sorting if necessary
    // data = data.sort((a, b) => d3.descending(a.frequency, b.frequency))

    // Add X axis
    x.domain([0, d3.max(data, (d) => d.frequency)]);
    xAxis.transition().duration(1000).call(d3.axisBottom(x));

    // Y axis
    y.domain(
      data.map(function (d) {
        return d.text;
      })
    );
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    svg.select("g").call(d3.axisLeft(y)).selectAll("text");

    // X axis
    x.domain([0, d3.max(data, (d) => d.frequency)]);
    xAxis.transition().duration(1000).call(d3.axisBottom(x));

    // Add Y axis
    y.domain(
      data.map(function (d) {
        return d.text;
      })
    );

    yAxis
      .transition()
      .duration(1000)
      .call(d3.axisLeft(y))
      .style("text-anchor", "end")
      .style("color", "#fff")
      .style("font-size", "15");

    // variable j: map data to existing lines
    var j = svg.selectAll(".myLine").data(data);

    // update lines
    j.enter()
      .append("line")
      .attr("class", "myLine")
      .merge(j)
      .transition()
      .duration(1000)
      .attr("x1", function (d) {
        return x(d.frequency);
      })
      .attr("x2", x(0))
      .attr("y1", function (d) {
        return y(d.text);
      })
      .attr("y2", function (d) {
        return y(d.text);
      })
      .attr("stroke", "grey");

    // variable u: map data to existing circles
    var u = svg.selectAll("circle").data(data);

    // update circles
    u.enter()
      .append("circle")
      .merge(u)
      .transition()
      .duration(1000)
      .attr("cx", function (d) {
        return x(d.frequency);
      })
      .attr("cy", function (d) {
        return y(d.text);
      })
      .attr("r", 6)
      .attr("fill", "#69b3a2");
  });
  // .finally(() => {
  //     x3dom.reload();
  // });
}

update(0);
