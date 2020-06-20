if (typeof require != "undefined") {
  // hack for loading from generator
  var d3 = require("./d3.min.js");
}

function splitArray(array, part) {
  var tmp = [];
  for (var i = 0; i < array.length; i += part) {
    tmp.push(array.slice(i, i + part));
  }
  return tmp;
}

// Helper function to draw a circle.
// TODO: replace with canvas blitting for web rendering
function circle(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, 2 * Math.PI);
  g.fill();
  g.stroke();
}

// Visualize the given points with the given message.
// If "no3d" is set, ignore the 3D cue for size.
function visualize(points, canvas, message, no3d) {
  var width = canvas.width;
  var height = canvas.height;
  var g = canvas.getContext("2d");
  g.fillStyle = "white";
  g.fillRect(0, 0, width, height);
  var xExtent = d3.extent(points, function (p) {
    return p.coords[0];
  });
  var yExtent = d3.extent(points, function (p) {
    return p.coords[1];
  });
  var zExtent = d3.extent(points, function (p) {
    return p.coords[2];
  });
  var zScale = d3.scaleLinear().domain(zExtent).range([2, 10]);

  var centerX = (xExtent[0] + xExtent[1]) / 2;
  var centerY = (yExtent[0] + yExtent[1]) / 2;
  var scale =
    Math.min(width, height) /
    Math.max(xExtent[1] - xExtent[0], yExtent[1] - yExtent[0]);
  scale *= 0.9; // Leave a little margin.
  g.strokeStyle = "rgba(255,255,255,.5)";
  var is3d = !no3d && points[0].coords.length > 2;
  var index = [];
  var n = points.length;
  if (is3d) {
    for (var i = 0; i < n; i++) {
      index[i] = i;
    }
    index.sort(function (a, b) {
      return d3.ascending(points[a].coords[2], points[b].coords[2]);
    });
  }

  for (var i = 0; i < n; i++) {
    var p = is3d ? points[index[i]] : points[i];
    g.fillStyle = p.color;
    var x = (p.coords[0] - centerX) * scale + width / 2;
    var y = -(p.coords[1] - centerY) * scale + height / 2;
    var r = is3d ? zScale(p.coords[2]) : 4;
    circle(g, x, y, r);
  }

  if (message) {
    g.fillStyle = "#000";
    g.font = "24pt Lato";
    g.fillText(message, 8, 34);
  }
}

if (typeof module != "undefined")
  module.exports = {
    visualize: visualize,
  };

function visualize_latent_space(Z, Zeta, width, height, margin) {
  // console.log(Z)
  // console.log(Zeta)
  d3.select("#svg_latent").select("svg").remove();

  // console.log(width)
  // console.log(height)

  var svg_f = d3
    .select("#svg_latent")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // var xScale = d3
  //   .scaleLinear()
  //   .domain([-1.1, 1.1])
  //   .range([margin.left, width - margin.right]);

  // var yScale = d3
  //   .scaleLinear()
  //   .domain([-1.1, 1.1])
  //   .range([height - margin.bottom, margin.top]);

  var xScale = d3
    .scaleLinear()
    .domain([
      d3.min(Z, function (d) {
        return d.coords[0];
      }),
      d3.max(Z, function (d) {
        return d.coords[0];
      }),
    ])
    .range([margin.left, width - margin.right]);

  var yScale = d3
    .scaleLinear()
    .domain([
      d3.min(Z, function (d) {
        return d.coords[1];
      }),
      d3.max(Z, function (d) {
        return d.coords[1];
      }),
    ])
    .range([height - margin.bottom, margin.top]);

  var axisx = d3.axisBottom(xScale).ticks(5);
  var axisy = d3.axisLeft(yScale).ticks(5);

  svg_f
    .append("g")
    .attr("transform", "translate(" + 0 + "," + (height - margin.bottom) + ")")
    .call(axisx)
    .append("text")
    .attr("fill", "black")
    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("font-size", "10pt")
    .attr("font-weight", "bold")
    .text("X");

  svg_f
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
    .call(axisy)
    .append("text")
    .attr("fill", "black")
    .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
    .attr("y", -35)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "10pt")
    .text("Y");

  // svg_f.append("g")
  //     .selectAll("circle")
  //     .data(Zeta)
  //     .enter()
  //     .append("circle")
  //     .attr("cx", function(d) { return xScale(d.coords[0]); })
  //     .attr("cy", function(d) { return yScale(d.coords[1]); })
  //     .attr("fill", "white")
  //     .attr("stroke", "red")
  //     .attr("stroke-width", 1)
  //     .attr("r", 2);

  svg_f
    .append("g")
    .selectAll("circle")
    .data(Z, (d) => {
      return d.coords;
    })
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.coords[0]);
    })
    .attr("cy", function (d) {
      return yScale(d.coords[1]);
    })
    .attr("fill", (d) => d.color)
    .attr("r", 3);
}

function visualize_observation_space(X, Y, width, height, margin, IsWireframe) {
  d3.select("#svg_observation").select("svg").remove();

  var svg_f = d3
    .select("#svg_observation")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  var xScale = d3
    .scaleLinear()
    .domain([
      d3.min(X, function (d) {
        return d.coords[0];
      }) * 1.2,
      d3.max(X, function (d) {
        return d.coords[0];
      }) * 1.2,
    ])
    .range([margin.left, width - margin.right]);

  var yScale = d3
    .scaleLinear()
    .domain([
      d3.min(X, function (d) {
        return d.coords[1];
      }) * 1.2,
      d3.max(X, function (d) {
        return d.coords[1];
      }) * 1.2,
    ])
    .range([height - margin.bottom, margin.top]);

  var axisx = d3.axisBottom(xScale).ticks(5);
  var axisy = d3.axisLeft(yScale).ticks(5);

  svg_f
    .append("g")
    .attr("transform", "translate(" + 0 + "," + (height - margin.bottom) + ")")
    .call(axisx)
    .append("text")
    .attr("fill", "black")
    .attr("x", (width - margin.left - margin.right) / 2 + margin.left)
    .attr("y", 35)
    .attr("text-anchor", "middle")
    .attr("font-size", "10pt")
    .attr("font-weight", "bold")
    .text("X");

  svg_f
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
    .call(axisy)
    .append("text")
    .attr("fill", "black")
    .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
    .attr("y", -35)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("font-weight", "bold")
    .attr("font-size", "10pt")
    .text("Y");

  svg_f
    .append("g")
    .selectAll("circle")
    .data(X)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.coords[0]);
    })
    .attr("cy", function (d) {
      return yScale(d.coords[1]);
    })
    .attr("fill", (d) => d.color)
    .attr("r", 3);

  svg_f
    .append("g")
    .selectAll("circle")
    .data(Y)
    .enter()
    .append("circle")
    .attr("cx", function (d) {
      return xScale(d.coords[0]);
    })
    .attr("cy", function (d) {
      return yScale(d.coords[1]);
    })
    .attr("fill", "red")
    .attr("r", 2);

  // line作成関数
  var curveFunc = d3
    .line()
    .curve(d3.curveLinear) // curveメソッドで線の形を変更
    .x(function (d) {
      return xScale(d.coords[0]);
    })
    .y(function (d) {
      return yScale(d.coords[1]);
    });

  // wireframeを正方と仮定しているのでSOMはOKだが，UKRだとデータ数が正方にならずエラーがでるときがあるので注意
  if (IsWireframe == false) {
    // Path追加
    svg_f
      .append("path")
      .attr("d", curveFunc(Y))
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("fill", "none");
  } else {
    let Y_reshape = splitArray(Y, ~~Math.sqrt(Y.length));
    for (let i = 0; i < Y_reshape.length; i++) {
      svg_f
        .append("path")
        .attr("d", curveFunc(Y_reshape[i]))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none");
    }
    Y_transpose = transpose(Y_reshape);
    for (let i = 0; i < Y_transpose.length; i++) {
      svg_f
        .append("path")
        .attr("d", curveFunc(Y_transpose[i]))
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("fill", "none");
    }
  }
}

const plot_f_withPlotly = (X, Y, width, height, margin, IsWireframe) => {
  var trace1 = {
    x: X.map((x) => x.coords[0]),
    y: X.map((x) => x.coords[1]),
    z: X.map((x) => x.coords[2]),
    mode: "markers",
    marker: {
      size: 5,
      color: X.map((d) => d.color),
      // line: {
      //     color: X.map(d => d.color),
      //     width: 0.5},
      showlegend: true,
      opacity: 0.8,
    },
    type: "scatter3d",
  };

  var data = [trace1];

  if (IsWireframe) {
    let Y_reshape = splitArray(Y, ~~Math.sqrt(Y.length));
    for (let i = 0; i < Y_reshape.length; i++) {
      var trace = {
        type: "scatter3d",
        mode: "lines",
        x: Y_reshape[i].map((y) => y.coords[0]),
        y: Y_reshape[i].map((y) => y.coords[1]),
        z: Y_reshape[i].map((y) => y.coords[2]),
        opacity: 1,
        line: {
          width: 2,
          color: "red",
          reversescale: false,
          showlegend: false,
        },
      };
      data.push(trace);
    }
    // console.log(Y)
    // console.log(Y_reshape)
    Y_transpose = transpose(Y_reshape);
    for (let i = 0; i < Y_reshape.length; i++) {
      var trace = {
        type: "scatter3d",
        mode: "lines",
        x: Y_transpose[i].map((y) => y.coords[0]),
        y: Y_transpose[i].map((y) => y.coords[1]),
        z: Y_transpose[i].map((y) => y.coords[2]),
        opacity: 1,
        line: {
          width: 2,
          color: "red",
          reversescale: false,
          showlegend: false,
        },
      };
      data.push(trace);
    }
  } else {
    var trace = {
      type: "scatter3d",
      mode: "lines",
      x: Y.map((y) => y.coords[0]),
      y: Y.map((y) => y.coords[1]),
      z: Y.map((y) => y.coords[2]),
      opacity: 1,
      line: {
        width: 2,
        color: "red",
        reversescale: false,
        showlegend: false,
      },
    };
    data.push(trace);
  }

  var layout = {
    width: width,
    height: height,
    showlegend: false,
    margin: {
      l: 0,
      r: 0,
      b: 0,
      t: 0,
    },
  };
  Plotly.newPlot("svg_observation", data, layout);
};
