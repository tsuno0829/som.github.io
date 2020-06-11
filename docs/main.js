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
  .classed("demo-data", true);
// .on("click", function (d, i) {
//   showDemo(i);
// });

dataMenus
  .append("canvas")
  .attr("width", 150)
  .attr("height", 150)
  .each(function (d, i) {
    var demo = demos[i];
    var params = [demo.options[0].start];
    if (demo.options[1]) params.push(demo.options[1].start);
    var points = demo.generator.apply(null, params);
    console.log("ueeeei");
    console.log(points);
    var canvas = d3.select(this).node();
    visualize(points, canvas, null, null);
  });

dataMenus.append("span").text(function (d) {
  return d.name;
});

function init() {
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
  return [data, node, ldim, sigmax, sigmin, epoch, tau];
}

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
  var u = 0,
    v = 0;
  while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

const transpose = (a) => a[0].map((_, c) => a.map((r) => r[c]));

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
    if (Dim == 3) plot_f_withPlotly(X, Y, width, height, margin, Zdim == 2);
    else visualize_observation_space(X, Y, width, height, margin, Zdim == 2);

    //control the loop.
    var timeout = timescale(step);
    setTimeout(function () {
      frameId = window.requestAnimationFrame(iterate);
    }, timeout);
  }

  demo.pause = function () {
    console.log("paused");
    console.log(paused);
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

function main() {
  console.log(GLOBALS.stepLimit);
  if (GLOBALS.playgroundDemo != null) GLOBALS.playgroundDemo.destroy();
  var format = d3.format(",");
  const [N, K, ldim, sigmax, sigmin, nb_epoch, tau] = init();
  // let X = gridData(N)
  // let X = twoClustersData(N, 2)
  // let X = threeClustersData(N, 2)
  // let X = subsetClustersData(N, 2)
  // let X = sinData(N)
  // let X = linkData(N)
  // let X = unlinkData(N)
  // let X = trefoilData(N);
  let X = longClusterData(N);
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

try {
  main(); // 起動時の表示
  console.log(demos);
} catch (error) {
  console.log("ERROR");
}

document.getElementById("reset_btn").onclick = main;

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
    // main();
  };
  const setCurrentEpoch = (c) => (e) => {
    c.innerText = e.target.value;
    GLOBALS.stepLimit = e.target.value;
    setRunning(false);
    // main();
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
