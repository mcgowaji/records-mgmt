// colorbar
const container = d3.select("#colorbar");
const colourScale = d3
    .scaleSequential(d3.interpolateRdYlGn)
    .domain([0, 100]);
const domain = colourScale.domain();

const bar_width = 100;
const bar_height = 400;

const paddedDomain = fc.extentLinear()
      .pad([0.02, 0.02])
      .padUnit("percent")(domain);
    const [min, max] = paddedDomain;
    const expandedDomain = d3.range(min, max, (max - min) / bar_height);

const xScale = d3
    .scaleBand()
    .domain([0, 1])
    .range([0, bar_width]);

const yScale = d3
    .scaleLinear()
    .domain(paddedDomain)
    .range([bar_height, 0]);

const svgBar = fc
  .autoBandwidth(fc.seriesSvgBar())
  .xScale(xScale)
  .yScale(yScale)
  .crossValue(0)
  .baseValue((_, i) => (i > 0 ? expandedDomain[i - 1] : 0))
  .mainValue(d => d)
  .decorate(selection => {
    selection.selectAll("path").style("fill", d => colourScale(100 - d));
  });

  const new_names = {0: 'Mild', 100:'Severe'};

    const axisLabel = fc
      .axisRight(yScale)
      .tickValues([...domain])
      .tickSizeOuter(0)
      .decorate((s) => s.selectAll('text')
      .style('fill', '#fff')
      .style('font-size', '13px')
      .html(d => new_names[d])
      );

    const legendSvg = container.append("svg")
    	.attr("height", bar_height)
    	.attr("width", bar_width)
      .style('float', 'right')
      .style("border-radius", "25px");;
    
    const legendBar = legendSvg
    	.append("g")
    	.datum(expandedDomain)
    	.call(svgBar);
    
    const barWidth = Math.abs(legendBar.node().getBoundingClientRect().x);

    legendSvg.append("g")
    	.attr("transform", `translate(20, 0)`)
      .datum(expandedDomain)
      .call(axisLabel)
      .select(".domain")
      .attr("visibility", "hidden");
          
    container
    .style('z-index', '9998')

