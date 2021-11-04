function drawFlyby() {
  // Grab paths from html page
  var datapath = $("#datapath").data().name;
  var globepath = $("#globepath").data().name;

  var makeSolid = function (selection, color) {
    selection
      .append("appearance")
      .append("material")
      .attr("diffuseColor", color || "blue");
    return selection;
  };

  var makeGhost = function (selection, color) {
    selection
      .append("appearance")
      .append("material")
      .attr("transparency", dotTransparency)
      .attr("diffuseColor", color || "blue");
    return selection;
  };

  var clicked;
  // var advanced = false;
  var incidents = 0;
  var dotTransparency = 0;
  var dotSize = 0.14;
  // var dotsize = 1;

  // init colors
  var colorRange = Array.from({ length: 10 }, (x, i) => i / 10);

  var componentToHex = function (c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  };

  var rgbToHex = function (string) {
    string = string.substring(4, string.length - 1).split(",");
    string = string.map((sub) => Number.parseInt(sub, 10));
    let [r, g, b] = string;
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  };

  var width = window.innerWidth;
  var height = window.innerHeight;

  var x_scale = d3.scaleLinear().domain([0, 1]).range([0, 40]);

  var y_scale = d3.scaleLinear().domain([0, 1]).range([0, 40]);

  var z_scale = d3.scaleLinear().domain([0, 1]).range([0, 40]);

  var view_pos = [360, 20, 360];
  var fov = 1;
  var view_or = [0, 1, 0, 0.8];

  function loadChart(data) {
    // Generate chart
    var scene = d3.select("#chartholder").append("X3D").append("scene");

    scene
      .append("viewpoint")
      .attr("id", "dvp")
      .attr("position", view_pos.join(" "))
      .attr("orientation", view_or.join(" "))
      .attr("fieldOfView", fov)
      .attr("description", "defaultX3DViewpointNode")
      .attr("set_bind", "true");

    // Scatter point properties
    scene
      .selectAll(".point")
      .data(data)
      .enter()
      .append("transform")
      .attr("class", "point")
      .attr("translation", function (d) {
        return x_scale(d.x) + " " + y_scale(d.y) + " " + z_scale(d.z);
      })
      .attr("onmouseover", "handlemouseover(this, event);")
      .attr("onmouseout", "handlemouseout(this, event);")
      .attr("onclick", "handleclick(this, event);")
      .append("shape")
      .call(makeGhost, function (d) {
        return rgbToHex(d3.interpolateRdYlGn(1 - d.severity));
      })
      .append("sphere")
      .attr("radius", dotSize);

    // moving points around
    // scene.append('timeSensor')
    //   .attr('cycleInterval', 2)
    //   .attr('loop', 'true')
    //   .append('PositionInterpolator')
    //   .attr('DEF', 'move')
    //   .attr('key', '0 0.5 1')
    //   .attr('keyValue', '0 0 0  0 3 0  0 0 0')

    // Text properties
    scene
      .append("transform")
      .attr("class", "label")
      .attr("scale", "1 1 1")
      .append("billboard")
      .attr("axisOfRotation", "0 0 0")
      .append("shape")
      .call(makeSolid, "white")
      .append("Text")
      .attr("class", "labelText")
      .attr("string", " ")
      .append("fontstyle")
      .attr("size", 1)
      .attr("family", "SANS")
      .attr("style", "BOLD")
      .attr("justify", "END")
      .attr("quality", "3");

    // Background globe lines
    scene.append("inline").attr("url", globepath);
  }

  // Generate Chart from my CSV Data

  // d3.csv("{{ url_for('data', path='/enron_embedding_sample.csv') }}")

  d3.csv(datapath)
    .then((data) => {
      console.log(data[0]);
      // data = data.filter(d => d.Cluster == 100);
      console.log("length of data: ", data.length);
      var points = data.map((d, i) => {
        var p = {};
        p.x = +d.x;
        p.z = +d.y;
        p.y = +d.z;
        p.cluster = +d.Cluster;
        p.synopsis = d.Synopsis;
        p.severity = +d.Severity;
        return p;
      });

      loadChart(points);
    })
    .finally(() => {
      x3dom.reload();
    });

  // Callbacks
  function handlemouseover(target, event) {
    console.log(target.__data__.synopsis);
    d3.select(".label").attr("translation", target.translation);

    // d3.select(".labelText")
    //     .attr('string', Math.round(target.__data__.severity) + '   ');

    d3.select(event.hitObject)
      .select("appearance")
      .select("material")
      .attr("diffuseColor", "blue");

    d3.select("#summary").style("display", "inline");

    d3.select(".sumText").html(target.__data__.synopsis);
  }

  function handlemouseout(target, event) {
    d3.select(event.hitObject)
      .select("appearance")
      .select("material")
      .attr("diffuseColor", function (d) {
        return rgbToHex(d3.interpolateRdYlGn(1 - d.severity));
      });
  }

  function handleclick(target, event) {
    // d3.select('#summary')
    //   .style('display', 'inline');

    // d3.select('.sumText')
    //   .html(target.__data__.synopsis);

    d3.select("#wordcloud").style("display", "inline");

    d3.select("#opts")
      .style("display", "inline")
      .style("left", event.layerX + 30 + "px")
      .style("top", event.layerY + "px");

    d3.select("#optsClose")
      .style("display", "inline")
      .style("left", event.layerX + 180 + "px")
      .style("top", event.layerY + "px");

    update(target.__data__.cluster);

    clicked = target;
  }

  function waitingKeypress() {
    return new Promise((resolve) => {
      document.addEventListener("keydown", onKeyHandler);
      function onKeyHandler(e) {
        // console.log(e.key+ ' pressed, code # ' + e.keyCode);
        if (e.key === "Enter") {
          document.removeEventListener("keydown", onKeyHandler);
          resolve();
        }
      }
    });
  }

  async function blink() {
    // wait for enter key to execute query
    await waitingKeypress();
    var txt = d3.select("input[type=search]").node().value.toLowerCase();

    d3.selectAll(".point")
      .attr("render", "false")
      .filter(function (d, i) {
        if (d.synopsis.toLowerCase().includes(txt)) {
          console.log(d.synopsis.toLowerCase());
        }
        return d.synopsis.toLowerCase().includes(txt);
      })
      .attr("render", "true");
  }

  function resetSearch() {
    d3.selectAll(".point").attr("render", "true");

    d3.select("input[type=search]").node().value = "";
  }

  function selectDept() {
    var choice = Number.parseInt(d3.select("#opts").node().value, 10);

    d3.select("#opts").style("display", "none");

    d3.select("#optsClose").style("display", "none");

    movePoints(choice);
  }

  function movePoints(choice) {
    var count = 0;
    // count total points belonging to cluster, add to triage count

    var slidingPoints = d3.selectAll(".point").filter(function (d) {
      if (d.cluster === clicked.__data__.cluster) {
        count++;
      }
      return d.cluster === clicked.__data__.cluster;
    });
    // reposition points to be in a circle around the globe edges
    var radius = 250;
    var phase = (2 * Math.PI * (choice - 1)) / 8;
    var new_x = Math.round(radius * Math.cos(phase));
    var new_y = Math.round(radius * Math.sin(phase));

    slidingPoints
      .transition() // Move each box to the right point location
      .duration(2000)
      .attr("translation", function (d) {
        return (
          new_x +
          x_scale(d.x) +
          " " +
          (new_y + y_scale(d.y)) +
          " " +
          z_scale(d.z)
        );
      });

    // Get rid of label
    // d3.select(".labelText")
    //   .attr('string', ' ');

    // Add to triage total
    incidents += count;
    d3.select("#triage").html("Incidents triaged: " + incidents + ".");
  }

  // Close out boxes when x pressed
  window.onload = function () {
    document.getElementById("summaryClose").onclick = function () {
      document.getElementById("summary").style.display = "none";
    };

    document.getElementById("wordcloudClose").onclick = function () {
      document.getElementById("wordcloud").style.display = "none";
    };

    document.getElementById("optsClose").onclick = function () {
      document.getElementById("opts").style.display = "none";
      document.getElementById("optsClose").style.display = "none";
    };
  };
}
