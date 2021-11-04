function drawTimeline(data) {
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
    var colors = ["darkorange", "lightblue"];

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

    // var maxLength = d3.max(data.map(function(d){ return d.date.length}));
    var maxLength = 10;
    var barWidth = maxLength * 7;
    var numBars = Math.round(width / barWidth);
    var isScrollDisplayed = barWidth * data.length > width;

    console.log(isScrollDisplayed);
    // set the axis ranges
    var xscale = d3
      .scaleBand()
      .range([0, width - 100])
      .padding(0.1);
    var yscale = d3.scaleLinear().range([height, 0]);

    var z = d3.scaleOrdinal().range(["darkorange", "lightblue"]).domain(keys);

    // Scale the range of the data in the domains
    xscale.domain(
      data.map(function (d) {
        return d.date;
      })
    );
    yscale.domain([0, d3.max(data, (d) => d3.sum(keys, (k) => +d[k]))]).nice();

    // Create initial canvas
    var svg = d3
      .select("#timeLine")
      .append("svg")
      // .attr("width", width + margin.left + margin.right)
      // .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", "0 0 110 80")
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
    var xAxis = svg
      .append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0, " + height + ")")
      .call(
        d3.axisBottom(xscale).tickFormat(function (d) {
          return d.toDateString().substring(4);
        })
      )
      .selectAll("text")
      .attr("height", svg.height)
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // add the y Axis
    svg.append("g").attr("class", "y axis").call(d3.axisLeft(yscale));

    // Add data
    var group = svg
      .selectAll("g.layer")
      .data(d3.stack().keys(keys)(data), (d) => d.key);

    group.exit().remove();

    group
      .enter()
      .append("g")
      .classed("layer", true)
      .attr("fill", (d) => z(d.key));

    var bars = svg
      .selectAll("g.layer")
      .selectAll("rect")
      .data(
        (d) => d,
        (e) => e.data.State
      );

    bars.exit().remove();

    bars
      .enter()
      .append("rect")
      .attr("width", xscale.bandwidth())
      .merge(bars)
      .attr("x", (d) => xscale(d.data.date))
      .attr("y", (d) => {
        return yscale(d[1]);
      })
      .attr("height", (d) => yscale(d[0]) - yscale(d[1]))
      .attr("class", "layer")
      .attr("clip-path", "url(#clip)")
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

    // if (isScrollDisplayed)
    // {

    //   var xOverview = d3.scaleBand()
    //                   .domain(data.map(function (d) { return d.date; }))
    //                   .range([0, width]);
    //   yOverview = d3.scaleLinear().range([heightOverview, 0]);
    //   yOverview.domain(yscale.domain());

    //   var subBars = svg.selectAll('.subBar')
    //       .data(data)

    //   subBars.enter().append("rect")
    //       .classed('subBar', true)
    //       .attr({
    //           height: function(d) {
    //               return heightOverview - yOverview(d.value);
    //           },
    //           width: function(d) {
    //               return xOverview.rangeBand()
    //           },
    //           x: function(d) {

    //               return xOverview(d.date);
    //           },
    //           y: function(d) {
    //               return height + heightOverview + yOverview(d.value)
    //           }
    //       })

    //   var displayed = d3.scaleQuantize()
    //     .domain([0, width])
    //     .range(d3.range(data.length));

    //   svg.append("rect")
    //     .attr("transform", "translate(0, " + (height + margin.bottom) + ")")
    //     .attr("class", "mover")
    //     .attr("x", 0)
    //     .attr("y", 0)
    //     .attr("height", selectorHeight)
    //     .attr("width", Math.round(parseFloat(numBars * width)/data.length))
    //     .attr("pointer-events", "all")
    //     .attr("cursor", "ew-resize")
    //     .call(d3.drag().on("drag", display));
    // }

    // function display () {
    //   var x = parseInt(d3.select(this).attr("x")),
    //       nx = x + d3.event.dx,
    //       w = parseInt(d3.select(this).attr("width")),
    //       f, nf, new_data, rects;

    //   if ( nx < 0 || nx + w > width ) return;

    //   d3.select(this).attr("x", nx);

    //   f = displayed(x);
    //   nf = displayed(nx);

    //   if ( f === nf ) return;

    //   new_data = data.slice(nf, nf + numBars);

    //   xscale.domain(new_data.map(function (d) { return d.date; }));
    //   svg.select(".x.axis").call(xAxis);

    //   rects = bars.selectAll("rect")
    //     .data(new_data, function (d) {return d.date; });

    //   rects.attr("x", function (d) { return xscale(d.date); });

    //   rects.enter().append("rect")
    //     .attr("class", "bar")
    //     .attr("x", function (d) { return xscale(d.date); })
    //     .attr("y", function (d) { return yscale(d.value); })
    //     .attr("width", xscale.rangeBand())
    //     .attr("height", function (d) { return height - yscale(d.value); });

    //   rects.exit().remove();
    // };

    // Draw legend
    var legend = svg
      .selectAll(".legend")
      .data(colors)
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function (d, i) {
        return "translate(-60," + i * 19 + ")";
      });

    legend
      .append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", function (d, i) {
        return colors.slice().reverse()[i];
      });

    legend
      .append("text")
      .attr("x", width + 5)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "start")
      .text(function (d, i) {
        switch (i) {
          case 0:
            return "Sent";
          case 1:
            return "Received";
        }
      });
  } catch (error) {
    console.error("error loading timeline: ", error);
  }
}
