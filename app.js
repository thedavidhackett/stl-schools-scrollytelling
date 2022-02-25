Promise.all([d3.json("schools.json")])
  .then(ready)
  .catch((err) => {
    console.log(err);
  });

function ready(res) {
  let raw = res[0];
  let width = 600;
  let height = 800;

  console.log(raw);

  let schools = topojson.feature(raw, raw.objects.schools_long);
  let stl = topojson.feature(raw, raw.objects.Neighborhood_Boundaries);

  let svg = d3.select("body").select("svg");

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  let projection = d3
    .geoIdentity()
    .reflectY(true)
    .fitSize([width, height], stl);

  let path = d3.geoPath().projection(projection);

  //let innerlines = topojson.mesh(raw, raw.objects.state, (a, b) => a != b);

  svg
    .append("g")
    .selectAll(".neighborhood")
    .data(stl.features)
    .join("path")
    .attr("d", path)
    .style("fill", "none")
    .style("stroke", "#333")
    .style("stroke-width", "0.5")
    .style("pointer-events", "none");

  let legendLabels = [
    { text: "Charter School", color: "red" },
    { text: "Neighborhood School", color: "blue" },
    { text: "Alternative/Magnet School", color: "lightgray" },
  ];

  let yPlacement = 0;
  for (let label of legendLabels) {
    svg
      .append("circle")
      .attr("r", 8)
      .attr("fill", label.color)
      .attr("cx", 8)
      .attr("cy", 50 + yPlacement);

    svg
      .append("text")
      .attr("x", 25)
      .attr("y", 55 + yPlacement)
      //.attr("dy", 17)
      .text(label.text);

    yPlacement += 25;
  }

  console.log(schools.features);
  function determineColor(d) {
    if (d.properties.CHARTER == "True") {
      return "red";
    }
    if (d.properties.ALTERNATIVE == "True" || d.properties.MAGNET == "True") {
      return "lightgray";
    }

    return "blue";
  }
  let points = svg
    .append("g")
    .selectAll(".school")
    .data(schools.features)
    .join("circle")
    .attr("cx", (d) => path.centroid(d)[0])
    .attr("cy", (d) => path.centroid(d)[1])
    .attr("id", (d) => `school-${d.properties.FULL_CODE}`)
    .attr("class", "school")
    .style("fill", determineColor)
    .style("stroke", "white")
    .style("stroke-width", "0.5")
    .attr("r", (d) => Math.sqrt(d.properties["2001"] / 3))
    .sort((a, b) => a.properties["2001"] < b.properties["2001"]);

  let labels = svg
    .append("g")
    .selectAll(".label")
    .data(schools.features)
    .join("text")
    .attr("class", "label")
    .attr("id", (d) => `label-${d.properties.FULL_CODE}`)
    .attr("x", (d) => path.centroid(d)[0])
    .attr("y", (d) => path.centroid(d)[1])
    .text((d) => `${d.properties.SCHOOL_NAME}`)
    .attr("dx", 25)
    .style("fill", "none");

  points.on("mouseover", (event, d) => {
    let text = `${d.properties.SCHOOL_NAME}`;

    points
      .filter((x) => x.properties.SCHOOL_NAME != d.properties.SCHOOL_NAME)
      .transition()
      .style("opacity", 0.25);

    svg.select(`#label-${d.properties.FULL_CODE}`).style("fill", "black");
    svg.select(`#school-${d.properties.FULL_CODE}`).style("fill", "black");
  });

  points.on("mouseout", (event, d) => {
    labels.style("fill", "none");
    points.style("fill", determineColor).transition().style("opacity", 1);
  });

  const container = d3.select(".scrolly-overlay");
  const stepSel = container.selectAll(".step"); //final all the step nodes
  const yearLegend = d3.select("#year");

  function updateChart(index) {
    const sel = container.select(`[data-index='${index}']`);
    const year = sel.attr("data-year");
    yearLegend.html(year);
    points.transition().attr("r", (d) => Math.sqrt(d.properties[year] / 3));
  }

  function init() {
    enterView({
      //our main view function
      selector: stepSel.nodes(),
      offset: 0.5, //when the slide is 50% away then trigger your chart
      enter: (el) => {
        //what's supposed to happen when the slide enters?
        let index = +d3.select(el).attr("data-index"); //extract the data-index attribute. this can be anything: a filter, a date, whatever.

        updateChart(index);
      },
      exit: (el) => {
        //what's supposed to happen when the slide exits?
        let index = +d3.select(el).attr("data-index");
        index = Math.max(0, index - 1);
        updateChart(index);
      },
    });
  }

  init();
}
