if (typeof require != "undefined") {
  var somjs = require("./som.js");
}

var GLOBALS = {
  playgroundDemo: null, // the object to control running the playground simulation
  trayDemo: null, // the object to control running the tray simulation
  running: true,
  unpausedBefore: false,
  stepLimit: 20,
  state: {},
  showDemo: null,
  perplexitySlider: null,
  epsilonSlider: null,
  selected_id: 0,
};

// function showDemo(index, initializeFromState) {
//   GLOBALS.state.demo = index;
//   demo = demos[index];
//   // Show description of demo data.
//   //document.querySelector('#data-description span').textContent = demo.description;
//   d3.select("#data-description span").text(demo.description);
//   // Create UI for the demo data options.
//   var dataOptionsArea = document.getElementById("data-options");
//   dataOptionsArea.innerHTML = "";
//   optionControls = demo.options.map(function (option, i) {
//     var value = initializeFromState
//       ? GLOBALS.state.demoParams[i]
//       : option.start;
//     return makeSlider(
//       dataOptionsArea,
//       option.name,
//       option.min,
//       option.max,
//       value
//     );
//   });
// }

// Create menu of possible demos.
var menuDiv = d3.select("#data-menu");

var dataMenus = menuDiv
  .selectAll(".demo-data")
  .data(demos)
  .enter()
  .append("div")
  .classed("demo-data", true)
  .on("click", function (d, i) {
    GLOBALS.selected_id = i;
    var demo = demos[i];
    // console.log(demo.options[0].start);
    data_slider = document.getElementById("data-slider");
    data_slider.min = demo.options[0].min;
    data_slider.max = demo.options[0].max;
    data_slider.defaultValue = demo.options[0].start;
    data_slider.value = demo.options[0].start;
    // data_slider.innerHTML = demo.options[0].start;
    var params = [demo.options[0].start];
    if (demo.options[1]) params.push(demo.options[1].start);
    var data_Dim = d3
      .select("#data-option")
      .select(".menu")
      .select("#Dimensions");
    data_Dim.selectAll("td").remove();
    if (demo.options[1]) {
      params.push(demo.options[1].start);
      data_Dim.append("td").append("span").attr("id", "current-dataDim");
      data_Dim
        .append("td")
        .append("input")
        .attr("id", "dataDim-slider")
        .attr("type", "range")
        .attr("min", demo.options[1].min)
        .attr("max", demo.options[1].max)
        .attr("defaultValue", demo.options[1].start)
        .attr("value", demo.options[1].start)
        .on("input", () => {
          d3.select("#current-dataDim").node().innerHTML =
            "dimension of points " + d3.select("#dataDim-slider").node().value;
          // console.log(d3.select("#dataDim-slider").node().value);
          setRunning(false);
          var demo = demos[GLOBALS.selected_id];
          var params = [parseInt(document.getElementById("data-slider").value)];
          if (demo.options[1])
            params.push(d3.select("#dataDim-slider").node().value);
          // console.log(d3.select("#dataDim-slider").node().value);
          var points = demo.generator.apply(null, params);
          main(points);
        });
      d3.select("#current-dataDim").node().innerHTML =
        "dimension of points " + demo.options[1].start;
      data_Dim.select("#dataDim-slider").node().innerHTML =
        demo.options[1].start;
    }
    var points = demo.generator.apply(null, params);
    main(points);
  });

dataMenus
  .append("canvas")
  .attr("width", 150)
  .attr("height", 150)
  .each(function (d, i) {
    var demo = demos[i];
    var params = [demo.options[0].start];
    if (demo.options[1]) params.push(demo.options[1].start);
    var points = demo.generator.apply(null, params);
    var canvas = d3.select(this).node();
    visualize(points, canvas, null, null);
  });

dataMenus.append("span").text(function (d) {
  return d.name;
});

function init(rtn = false) {
  const data = parseInt(document.getElementById("data-slider").value);
  const node = parseInt(document.getElementById("node-slider").value);
  const ldim = parseInt(document.getElementById("ldim-slider").value);
  const sigmax = parseFloat(document.getElementById("sigmax-slider").value);
  const sigmin = parseFloat(document.getElementById("sigmin-slider").value);
  const epoch = parseFloat(document.getElementById("epoch-slider").value);
  const tau = parseFloat(document.getElementById("tau-slider").value);
  document.getElementById("current-data").innerHTML = data;
  document.getElementById("current-node").innerHTML = node;
  document.getElementById("current-ldim").innerHTML = ldim;
  document.getElementById("current-sigmax").innerHTML = sigmax;
  document.getElementById("current-sigmin").innerHTML = sigmin;
  document.getElementById("current-epoch").innerHTML = epoch;
  document.getElementById("current-tau").innerHTML = tau;
  if (rtn) return [data, node, ldim, sigmax, sigmin, epoch, tau];
}

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function splitArray(array, part) {
  var tmp = [];
  for (var i = 0; i < array.length; i += part) {
    tmp.push(array.slice(i, i + part));
  }
  return tmp;
}

function initMatrix(n, dim) {
  // if (dim > 3){
  //     throw new Error(dim)
  // }

  let points = [];
  if (dim == 1) {
    for (let i = 0; i < n; i++) {
      points.push([randn_bm() * 0.01, 0]);
    }
  } else {
    for (let i = 0; i < n; i++) {
      let arr2 = [];
      for (let j = 0; j < dim; j++) {
        arr2.push(randn_bm() * 0.01);
      }
      points.push(arr2);
      // console.log(arr2)
      // points.push(new Point(arr2, '#f89'))
      // console.log(new Point(arr2, '#f89'))
    }
  }
  // console.log("aaa")
  // console.log(points)
  return points.map(function (p) {
    return new Point(p);
  });
  // return points
}

// var playPause = document.getElementById('play-pause');
function setRunning(r) {
  GLOBALS.running = r;
  GLOBALS.playgroundRunning = r;
  if (GLOBALS.running) {
    GLOBALS.playgroundDemo.unpause();
    // playPause.setAttribute("class", "playing")
  } else {
    GLOBALS.playgroundDemo.pause();
    // playPause.setAttribute("class", "paused")
  }
}

function demoMaker(
  X,
  Y,
  Z,
  Zeta,
  N,
  K,
  ldim,
  sigmax,
  sigmin,
  nb_epoch,
  tau,
  width,
  height,
  margin,
  stepCb
) {
  var demo = {};
  var paused = false;
  var step = 0;
  var chunk = 1;
  var frameId;
  let Dim = X[0].coords.length;

  var timescale = d3
    .scaleLinear()
    .domain([0, 20, 50, 100, 200, 6000])
    .range([60, 30, 20, 10, 0]);

  var som = new somjs.SOM();
  // var dists = distanceMatrix(points);
  // tsne.initDataDist(dists);

  function iterate() {
    if (paused) return;

    // control speed at which we iterate
    // if(step >= 200) chunk = 10;
    for (var k = 0; k < chunk; k++) {
      // tsne.step();
      sigma = calc_sigma(step, tau, sigmax, sigmin);
      Y = som.estimate_f(X, Y, Z, Zeta, sigma);
      Z = som.estimate_z(X, Y, Z, Zeta);
      step++;
    }

    //inform the caller about the current step
    stepCb(step);

    visualize_latent_space(Z, Zeta, width, height, margin);
    // Dim=1,2,3のときだけ観測空間を表示
    if (Dim == 3) plot_f_withPlotly(X, Y, width, height, margin, Zdim == 2);
    else if (Dim == 1 || Dim == 2)
      visualize_observation_space(X, Y, width, height, margin, Zdim == 2);
    // else console.log(X);

    //control the loop.
    var timeout = timescale(step);
    setTimeout(function () {
      frameId = window.requestAnimationFrame(iterate);
    }, timeout);
  }

  demo.pause = function () {
    // console.log("paused");
    // console.log(paused);
    if (paused) return; // already paused
    paused = true;
    window.cancelAnimationFrame(frameId);
  };
  demo.unpause = function () {
    if (!paused) return; // already unpaused
    paused = false;
    iterate();
  };
  demo.paused = function () {
    return paused;
  };
  demo.destroy = function () {
    demo.pause();
    delete demo;
  };
  iterate();
  return demo;
}

function main(X) {
  if (GLOBALS.playgroundDemo != null) GLOBALS.playgroundDemo.destroy();
  d3.select("#figure").select("#svg_observation").remove();
  d3.select("#figure")
    .append("div")
    .attr("id", "svg_observation")
    .classed("a", true);

  // const setCurrentValue = (c) => (e) => {
  //   c.innerText = e.target.value;
  //   setRunning(false);
  //   var demo = demos[GLOBALS.selected_id];
  //   var params = [parseInt(document.getElementById("data-slider").value)];
  //   if (demo.options[1]) params.push(demo.options[1].start);
  //   var points = demo.generator.apply(null, params);
  //   main(points);
  // };
  // var demo = demos[GLOBALS.selected_id];
  // console.log(demo.options[1]);
  // if (demo.options[1]) {
  //   console.log("options[1]");
  //   const current_dataDim = document.getElementById("current-dataDim");
  //   console.log(current_dataDim);
  //   document
  //     .getElementById("dataDim-slider")
  //     .addEventListener("input", setCurrentValue(current_dataDim));
  // }

  var format = d3.format(",");
  const [N, K, ldim, sigmax, sigmin, nb_epoch, tau] = init((rtn = true));
  Dim = X[0].coords.length;
  Zdim = ldim;
  const Zeta = create_zeta(K, Zdim);
  let Z = initMatrix(X.length, Zdim);
  for (let n = 0; n < X.length; n++) Z[n].color = X[n].color; // XとZが指すcolorを統一する
  let Y = initMatrix(Zeta.length, Dim);
  var width = 350;
  var height = 350;
  var margin = { top: 30, bottom: 60, right: 30, left: 60 };

  GLOBALS.playgroundDemo = demoMaker(
    X,
    Y,
    Z,
    Zeta,
    N,
    K,
    ldim,
    sigmax,
    sigmin,
    nb_epoch,
    tau,
    width,
    height,
    margin,
    function (step) {
      d3.select("#step").text(format(step));
      if (step >= GLOBALS.stepLimit) {
        setRunning(false);
      }
    }
  );
}

// try {
//   var demo = demos[0];
//   var params = [demo.options[0].start];
//   if (demo.options[1]) params.push(demo.options[1].start);
//   var points = demo.generator.apply(null, params);
//   main(points); // 起動時の表示
//   console.log(demos);
// } catch (error) {
//   console.log("ERROR");
// }

// document.getElementById("reset_btn").onclick = () => {
//   var demo = demos[GLOBALS.selected_id];
//   var params = [demo.options[0].start];
//   if (demo.options[1]) params.push(demo.options[1].start);
//   var points = demo.generator.apply(null, params);
//   main(points);
// };

window.onload = () => {
  const current_data = document.getElementById("current-data");
  const current_node = document.getElementById("current-node");
  const current_ldim = document.getElementById("current-ldim");
  const current_sigmax = document.getElementById("current-sigmax");
  const current_sigmin = document.getElementById("current-sigmin");
  const current_epoch = document.getElementById("current-epoch");
  const current_tau = document.getElementById("current-tau");
  const setCurrentValue = (c) => (e) => {
    c.innerText = e.target.value;
    setRunning(false);
    var demo = demos[GLOBALS.selected_id];
    var params = [parseInt(document.getElementById("data-slider").value)];
    if (demo.options[1]) params.push(d3.select("#dataDim-slider").node().value);
    // console.log(d3.select("#dataDim-slider").node().value);
    var points = demo.generator.apply(null, params);
    main(points);
  };
  const setCurrentEpoch = (c) => (e) => {
    c.innerText = e.target.value;
    GLOBALS.stepLimit = e.target.value;
    setRunning(false);
    var demo = demos[GLOBALS.selected_id];
    var params = [parseInt(document.getElementById("data-slider").value)];
    if (demo.options[1]) params.push(demo.options[1].start);
    var points = demo.generator.apply(null, params);
    main(points);
  };
  document
    .getElementById("data-slider")
    .addEventListener("input", setCurrentValue(current_data));
  document
    .getElementById("node-slider")
    .addEventListener("input", setCurrentValue(current_node));
  document
    .getElementById("ldim-slider")
    .addEventListener("input", setCurrentValue(current_ldim));
  document
    .getElementById("sigmax-slider")
    .addEventListener("input", setCurrentValue(current_sigmax));
  document
    .getElementById("sigmin-slider")
    .addEventListener("input", setCurrentValue(current_sigmin));
  document
    .getElementById("epoch-slider")
    .addEventListener("input", setCurrentEpoch(current_epoch));
  document
    .getElementById("tau-slider")
    .addEventListener("input", setCurrentValue(current_tau));
};
