function drawTimeline2(data) {
  try {
    console.log("drawing timeline with data", data);

    const parseDate = (d) => {
      const year = d["year"],
        month = d["month"],
        day = d["day"],
        newdate = new Date(
          year,
          month - 1, // neo4j dates start at 1, js dates start at 0
          day
        );

      return newdate;
    };

    var data = data.map((d, i) => {
      var p = {};
      p.date = parseDate(d);
      (p.sent = d["sent"] || 0), (p.received = d["received"] || 0);
      return p;
    });

    const keys = ["sent", "received"];

    // set the dimensions and margins of the graph
    // var margin = {top: 40, right: 20, bottom: 20, left: 30},
    //     width = 960 - margin.left - margin.right,
    //     height = 500 - margin.top - margin.bottom;

    // Using Caner Dagli's solution
    var margin = { top: 20, right: 10, bottom: 20, left: 40 };
    var marginOverview = { top: 30, right: 10, bottom: 20, left: 40 };
    var selectorHeight = 40;
    var width = 600 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom - selectorHeight;
    var heightOverview = 80 - marginOverview.top - marginOverview.bottom;
    var n = data.length;
    // var maxLength = d3.max(data.map(function(d){ return d.date.length}));
    var maxLength = 10;
    var barWidth = maxLength * 7;
    var numBars = Math.round(width / barWidth);
    var isScrollDisplayed = barWidth * data.length > width;

    // set the axis ranges
    var xscale = d3
      .scaleTime()
      .range([0, width])
      .domain(
        d3.extent(data, function (d) {
          return d.date;
        })
      );

    var x2 = xscale.copy();

    var yscale = d3.scaleLinear().range([height, 0]);
    // Scale the range of the data in the domains
    yscale.domain([0, d3.max(data, (d) => d3.sum(keys, (k) => +d[k]))]).nice();

    var z = d3.scaleOrdinal().range(["darkorange", "lightblue"]).domain(keys);

    var xAxis = d3
      .axisBottom()
      .scale(xscale)
      .tickFormat(function (d) {
        return d.toDateString().substring(4);
      })
      .tickPadding(2);

    var zoom = d3.zoom().on("zoom", zoomed);

    // Create initial canvas
    var svg = d3
      .select("#timeLine")
      .call(zoom)
      .append("svg")
      .attr("class", "chart")
      // .attr("width", width + margin.left + margin.right)
      // .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", "0 0 900 800")
      .attr("preserveAspectRatio", "xMaxYMax meet")
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // create clip-path that's the same size as drawing area
    svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height);

    svg = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Prep the tooltip bits, initial display is hidden
    const tooltip = d3
      .select("#content")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    tooltip
      .append("rect")
      .attr("width", 30)
      .attr("height", 20)
      .attr("fill", "white")
      .style("opacity", 0.5);

    tooltip
      .append("text")
      .attr("x", 15)
      .attr("dy", "1.2em")
      .style("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold");

    // add the x Axis
    var xAxisRef = svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", "translate(0, " + height + ")")
      .call(xAxis)
      .selectAll("text")
      //   .attr("height", svg.height)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    console.log("x axis", xAxisRef);
    // console.log(svg.select("g.x-axis"));
    // add the y Axis
    svg.append("g").attr("class", "y-axis").call(d3.axisLeft(yscale));

    // Add data
    var group = svg
      .selectAll("g.layer")
      .data(d3.stack().keys(keys)(data), (d) => d.key)
      .enter()
      .append("g")
      .classed("layer", true)
      .attr("fill", (d) => z(d.key))
      .attr("clip-path", "url(#clip)");

    var bars = svg
      .selectAll("g.layer")
      .selectAll("rect")
      .data(
        (d) => d,
        (e) => e.data.State
      );

    bars
      .enter()
      .append("rect")
      .attr("width", (0.7 * width) / n)
      .merge(bars)
      .attr("x", (d) => xscale(d.data.date))
      .attr("y", (d) => {
        return yscale(d[1]);
      })
      .attr("height", (d) => yscale(d[0]) - yscale(d[1]))
      .attr("class", "layer")
      .on("mouseover", (d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(d[1] - d[0] + " emails")
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(300).style("opacity", 0);
      });

    function zoomed() {
      //   console.warn("zoom");
      //   console.log(d3.event);
      //   svg.select("g.x-axis").call(xAxis);
      var rescale = d3.event.transform.rescaleX(x2);
      xAxis.scale(rescale);
      svg
        .select("g.x-axis")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
      svg
        .selectAll(".chart rect")
        .attr(
          "transform",
          "translate(" +
            d3.event.transform.x +
            ",0)scale(" +
            d3.event.transform.k +
            ", 1)"
        );
    }

    // Draw legend
    // var legend = svg
    //   .selectAll(".legend")
    //   .data(colors)
    //   .enter()
    //   .append("g")
    //   .attr("class", "legend")
    //   .attr("transform", function (d, i) {
    //     return "translate(-60," + i * 19 + ")";
    //   });

    // legend
    //   .append("rect")
    //   .attr("x", width - 18)
    //   .attr("width", 18)
    //   .attr("height", 18)
    //   .style("fill", function (d, i) {
    //     return colors.slice().reverse()[i];
    //   });

    // legend
    //   .append("text")
    //   .attr("x", width + 5)
    //   .attr("y", 9)
    //   .attr("dy", ".35em")
    //   .style("text-anchor", "start")
    //   .text(function (d, i) {
    //     switch (i) {
    //       case 0:
    //         return "Sent";
    //       case 1:
    //         return "Received";
    //     }
    //   });
  } catch (error) {
    console.error("error loading timeline: ", error);
  }
}
