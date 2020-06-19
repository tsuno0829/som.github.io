if (typeof require != "undefined") {
  var somjs = require("./som.js");
  var ukrjs = require("./ukr.js");
}

var GLOBALS = {
  playgroundDemo: null, // the object to control running the playground simulation
  trayDemo: null, // the object to control running the tray simulation
  running: true,
  unpausedBefore: false,
  stepLimit: document.getElementById("epoch-slider").value,
  state: {},
  showDemo: null,
  perplexitySlider: null,
  epsilonSlider: null,
  selected_model: "SOM",
  selected_id: 0,
  visibility: "off",
  current_Z: null,
  current_Y: null,
};

d3.select("#play_pause").on("click", () => {
  var play_pause = d3.select("#play_pause");

  // step >= stepLimitのとき，何もしない
  var step = parseInt(d3.select("#step").node().innerHTML);
  var stepLimit = parseInt(GLOBALS.stepLimit);
  if (step >= stepLimit) return;

  if (GLOBALS.playgroundDemo != null) {
    // 押されたときにplayとpauseのアイコンを切り替える
    var icon;
    if (play_pause.select("i").node().innerHTML == "pause") {
      icon = "play_arrow";
    } else {
      icon = "pause";
    }
    play_pause.select("i").remove();
    play_pause.append("i").attr("class", "material-icons");
    play_pause.select("i").node().innerHTML = icon;

    // pauseのときスタート，playのときポーズの状態にする
    if (icon == "pause") {
      setRunning(true);
    } else {
      setRunning(false);
    }
  }
});

d3.select("#refresh").on("click", (d, i) => {
  if (GLOBALS.playgroundDemo != null) {
    setRunning(false);

    // pauseアイコンに切り替える
    var play_pause = d3.select("#play_pause");
    var icon = "pause";
    play_pause.select("i").remove();
    play_pause.append("i").attr("class", "material-icons");
    play_pause.select("i").node().innerHTML = icon;

    // demoを実行する
    var demo = demos[GLOBALS.selected_id];
    var params = [parseInt(document.getElementById("data-slider").value)];
    if (demo.options[1]) params.push(d3.select("#dataDim-slider").node().value);
    if (demo.options[2]) params.push(demo.options[2].start);
    if (demo.options[3]) params.push(demo.options[3].start);
    var points = demo.generator.apply(null, params);
    main(points);
  }
});

d3.select("#visibility_on_off").on("click", () => {
  if (GLOBALS.playgroundDemo != null) {
    if (GLOBALS.visibility == "on") {
      GLOBALS.visibility = "off";
      // observation spaceを削除
      d3.select("#svg_observation").remove();
      // visibility iconをoffに変更
      var visi = d3.select("#visibility_on_off");
      visi.select("i").remove();
      visi.append("i").attr("class", "material-icons");
      visi.select("i").node().innerHTML = "visibility";
    } else {
      GLOBALS.visibility = "on";
      // observation spaceを作成
      d3.select("#figure").select("#svg_observation").remove();
      var observation_space = d3.select("#figure");
      observation_space
        .append("div")
        .attr("id", "svg_observation")
        .attr("class", "a");
      // visualize_Z_Y
      GLOBALS.playgroundDemo.visualize(true);
      // visibility iconをonに変更
      var visi = d3.select("#visibility_on_off");
      visi.select("i").remove();
      visi.append("i").attr("class", "material-icons");
      visi.select("i").node().innerHTML = "visibility_off";
    }
  }
});

function updateParameters() {
  if (GLOBALS.playgroundDemo != null) {
    GLOBALS.state.model = GLOBALS.selected_model;
    GLOBALS.state.demo_id = GLOBALS.selected_id;
    GLOBALS.state.data = document.getElementById("data-slider").value;
    if (demos[GLOBALS.selected_id].options[1]) {
      GLOBALS.state.dataDim = document.getElementById("dataDim-slider").value;
    }
    if (GLOBALS.selected_model == "SOM") {
      GLOBALS.state.node_reso = document.getElementById("node-slider").value;
      GLOBALS.state.ldim = document.getElementById("ldim-slider").value;
      GLOBALS.state.sigmax = document.getElementById("sigmax-slider").value;
      GLOBALS.state.sigmin = document.getElementById("sigmin-slider").value;
      GLOBALS.state.epoch = document.getElementById("epoch-slider").value;
      GLOBALS.state.tau = document.getElementById("tau-slider").value;
    } else {
      GLOBALS.state.ldim = document.getElementById("ldim-slider").value;
      GLOBALS.state.epoch = document.getElementById("epoch-slider").value;
      GLOBALS.state.eta = document.getElementById("eta-slider").value;
      GLOBALS.state.mapping_reso = document.getElementById(
        "mapping-resolution-slider"
      ).value;
    }
  }
  d3.select("#share")
    .style("display", "")
    .attr("href", "#" + generateHash());
}

function generateHash() {
  function stringify(map) {
    var s = "";
    for (key in map) {
      s += "&" + key + "=" + map[key];
    }
    return s.substring(1);
  }
  return stringify(GLOBALS.state);
}

// share-button
d3.select("#share").on("click", () => {
  // URLに最新のパラメータを反映する
  updateParameters();
  // URLをクリップボードにコピーする
  setTimeout(async () => {
    await navigator.clipboard.writeText(location.href);
    console.log("copied");
  }, 100);
});

// Create menu of possible demos.
var menuDiv = d3.select("#data-menu");

var dataMenus = menuDiv
  .selectAll(".demo-data")
  .data(demos)
  .enter()
  .append("div")
  .classed("demo-data", true)
  .on("click", function (d, i) {
    // playからpauseアイコンに切り替える
    var play_pause = d3.select("#play_pause");
    var icon = "pause";
    play_pause.select("i").remove();
    play_pause.append("i").attr("class", "material-icons");
    play_pause.select("i").node().innerHTML = icon;
    // demoの設定を行う
    GLOBALS.selected_id = i;
    var demo = demos[i];
    data_slider = document.getElementById("data-slider");
    data_slider.min = demo.options[0].min;
    data_slider.max = demo.options[0].max;
    data_slider.defaultValue = demo.options[0].start;
    data_slider.value = demo.options[0].start;
    var params = [demo.options[0].start];
    if (demo.options[1]) params.push(demo.options[1].start);
    if (demo.options[2]) params.push(demo.options[2].start);
    if (demo.options[3]) params.push(demo.options[3].start);
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
          setRunning(false);
          // パラメータが変更されたときに，現在の計算を中止して新規パラメータで再計算する
          d3.select("#current-dataDim").node().innerHTML =
            "dimension of points " + d3.select("#dataDim-slider").node().value;
          // demoの設定
          var demo = demos[GLOBALS.selected_id];
          var params = [parseInt(document.getElementById("data-slider").value)];
          if (demo.options[1])
            params.push(d3.select("#dataDim-slider").node().value);
          if (demo.options[2]) params.push(demo.options[2].start);
          if (demo.options[3]) params.push(demo.options[3].start);
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
    if (demo.options[2]) params.push(demo.options[2].start);
    if (demo.options[3]) params.push(demo.options[3].start);
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
  const tau = parseInt(document.getElementById("tau-slider").value);
  const eta = parseFloat(document.getElementById("eta-slider").value);
  const mapping_resolution = parseInt(
    document.getElementById("mapping-resolution-slider").value
  );
  document.getElementById("current-data").innerHTML = data;
  document.getElementById("current-node").innerHTML = node;
  document.getElementById("current-ldim").innerHTML = ldim;
  document.getElementById("current-sigmax").innerHTML = sigmax;
  document.getElementById("current-sigmin").innerHTML = sigmin;
  document.getElementById("current-epoch").innerHTML = epoch;
  document.getElementById("current-tau").innerHTML = tau;
  document.getElementById("current-eta").innerHTML = eta;
  document.getElementById(
    "current-mapping-resolution"
  ).innerHTML = mapping_resolution;
  if (rtn)
    return [
      data,
      node,
      ldim,
      sigmax,
      sigmin,
      epoch,
      tau,
      eta,
      mapping_resolution,
    ];
}

function splitArray(array, part) {
  var tmp = [];
  for (var i = 0; i < array.length; i += part) {
    tmp.push(array.slice(i, i + part));
  }
  return tmp;
}

function initMatrix(n, dim) {
  let points = [];
  if (dim == 1) {
    for (let i = 0; i < n; i++) {
      points.push([d3.randomNormal(0, 0.01)(), 0]);
    }
  } else {
    for (let i = 0; i < n; i++) {
      let arr2 = [];
      for (let j = 0; j < dim; j++) {
        arr2.push(d3.randomNormal(0, 0.01)());
      }
      points.push(arr2);
    }
  }
  return points.map(function (p) {
    return new Point(p);
  });
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
  eta,
  mapping_resolution,
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
  var h;
  var H;

  var timescale = d3
    .scaleLinear()
    .domain([0, 20, 50, 100, 200, 6000])
    .range([60, 30, 20, 10, 0]);

  var som, ukr;
  if (GLOBALS.selected_model == "SOM") som = new somjs.SOM();
  else ukr = new ukrjs.UKR();

  function iterate() {
    if (paused) return;

    // control speed at which we iterate
    if (step >= 200 || Dim == 3) chunk = 10;
    for (var k = 0; k < chunk; k++) {
      // SOM
      if (GLOBALS.selected_model == "SOM") {
        sigma = calc_sigma(step, tau, sigmax, sigmin);
        Y = som.estimate_f(X, Y, Z, Zeta, sigma);
        Z = som.estimate_z(X, Y, Z, Zeta);
      } else {
        // UKR
        // const eta = 1;
        [Y, h, H] = ukr.estimate_f(X, Y, Z);
        Z = ukr.estimate_z(X, Y, Z, h, H, eta);
      }
      GLOBALS.current_Z = Z;
      GLOBALS.current_Y = Y;
      //inform the caller about the current step
      stepCb(++step);
    }

    // visualize Z and Y(mapping)
    visualize_Z_Y();

    //control the loop.
    var timeout = timescale(step);
    setTimeout(function () {
      frameId = window.requestAnimationFrame(iterate);
    }, timeout);
  }

  function visualize_Z_Y(visibility_on = false) {
    if (visibility_on) {
      Z = GLOBALS.current_Z;
      Y = GLOBALS.current_Y;
    }
    // SOM
    if (GLOBALS.selected_model == "SOM") {
      visualize_latent_space(Z, Zeta, width, height, margin);
      // Dim=1,2,3のときだけ観測空間を表示
      if (GLOBALS.visibility == "on") {
        if (Dim == 3) plot_f_withPlotly(X, Y, width, height, margin, Zdim == 2);
        else if (Dim == 1 || Dim == 2)
          visualize_observation_space(X, Y, width, height, margin, Zdim == 2);
      }
    } else {
      // UKR
      visualize_latent_space(Z, Zeta, width, height, margin);
      if (Dim < 4 && GLOBALS.visibility == "on") {
        var newY = ukr.generate_new_mapping(X, Z, mapping_resolution);
        // Dim=1,2,3のときだけ観測空間を表示
        if (Dim == 3) {
          plot_f_withPlotly(X, newY, width, height, margin, Zdim == 2);
        } else if (Dim == 1 || Dim == 2)
          visualize_observation_space(
            X,
            newY,
            width,
            height,
            margin,
            Zdim == 2
          );
      }
    }
  }

  demo.pause = function () {
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
  demo.visualize = visualize_Z_Y;

  iterate();
  return demo;
}

function main(X) {
  if (GLOBALS.playgroundDemo != null) {
    // 前回のdemoを削除
    GLOBALS.playgroundDemo.destroy();
    // 前回の状態を破棄（要検討）
    GLOBALS.state = {};
    // 前回のdemoの観測空間の描画を削除
    d3.select("#figure").select("#svg_observation").remove();
    d3.select("#figure")
      .append("div")
      .attr("id", "svg_observation")
      .classed("a", true);
  }

  var format = d3.format(",");
  const [
    N,
    K,
    ldim,
    sigmax,
    sigmin,
    nb_epoch,
    tau,
    eta,
    mapping_resolution,
  ] = init((rtn = true));
  Dim = X[0].coords.length;
  Zdim = ldim;

  let Z = initMatrix(X.length, Zdim);
  for (let n = 0; n < X.length; n++) Z[n].color = X[n].color; // XとZが指すcolorを統一する

  var Y, Zeta;
  if (GLOBALS.selected_model == "SOM") {
    Zeta = create_zeta(K, Zdim);
    Y = initMatrix(Zeta.length, Dim);
  } else {
    Y = initMatrix(X.length, Dim);
  }

  var width = 350;
  var height = 350;
  var margin = { top: 30, bottom: 60, right: 30, left: 60 };

  // Dimが3以下のとき，観測データは表示せずにvisibility iconのみ表示する．
  if (Dim < 4) {
    GLOBALS.visibility = "off";
    var visi = d3.select("#visibility_on_off");
    document.getElementById("visibility_on_off").style.display = "";
    var icon = "visibility";
    visi.select("i").remove();
    visi.append("i").attr("class", "material-icons");
    visi.select("i").node().innerHTML = icon;
  } else {
    GLOBALS.visibility = "off";
    document.getElementById("visibility_on_off").style.display = "none";
  }

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
    eta,
    mapping_resolution,
    width,
    height,
    margin,
    function (step) {
      d3.select("#step").text(format(step));
      if (step >= GLOBALS.stepLimit) {
        setRunning(false);
        var play_pause = d3.select("#play_pause");
        var icon = "play_arrow";
        play_pause.select("i").remove();
        play_pause.append("i").attr("class", "material-icons");
        play_pause.select("i").node().innerHTML = icon;
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

window.onload = () => {
  const current_data = document.getElementById("current-data");
  const current_node = document.getElementById("current-node");
  const current_ldim = document.getElementById("current-ldim");
  const current_sigmax = document.getElementById("current-sigmax");
  const current_sigmin = document.getElementById("current-sigmin");
  const current_epoch = document.getElementById("current-epoch");
  const current_tau = document.getElementById("current-tau");
  const current_eta = document.getElementById("current-eta");
  const current_mapping_resolution = document.getElementById(
    "current-mapping-resolution"
  );
  const setCurrentValue = (c) => (e) => {
    c.innerText = e.target.value;
    if (GLOBALS.playgroundDemo != null) {
      setRunning(false);
      // playからpauseアイコンに切り替える
      var play_pause = d3.select("#play_pause");
      var icon = "pause";
      play_pause.select("i").remove();
      play_pause.append("i").attr("class", "material-icons");
      play_pause.select("i").node().innerHTML = icon;
      // demoの設定を行う
      var demo = demos[GLOBALS.selected_id];
      var params = [parseInt(document.getElementById("data-slider").value)];
      if (demo.options[1])
        params.push(d3.select("#dataDim-slider").node().value);
      if (demo.options[2]) params.push(demo.options[2].start);
      if (demo.options[3]) params.push(demo.options[3].start);
      var points = demo.generator.apply(null, params);
      main(points);
    }
  };
  const setCurrentEpoch = (c) => (e) => {
    c.innerText = e.target.value;
    GLOBALS.stepLimit = e.target.value;
    if (GLOBALS.playgroundDemo != null) {
      setRunning(false);
      // playからpauseアイコンに切り替える
      var play_pause = d3.select("#play_pause");
      var icon = "pause";
      play_pause.select("i").remove();
      play_pause.append("i").attr("class", "material-icons");
      play_pause.select("i").node().innerHTML = icon;
      // demoの設定を行う
      var demo = demos[GLOBALS.selected_id];
      var params = [parseInt(document.getElementById("data-slider").value)];
      if (demo.options[1]) params.push(demo.options[1].start);
      if (demo.options[2]) params.push(demo.options[2].start);
      if (demo.options[3]) params.push(demo.options[3].start);
      var points = demo.generator.apply(null, params);
      main(points);
    }
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
  document
    .getElementById("eta-slider")
    .addEventListener("input", setCurrentValue(current_eta));
  document
    .getElementById("mapping-resolution-slider")
    .addEventListener("input", setCurrentValue(current_mapping_resolution));

  //radio button's setting
  function model_select() {
    var models = document.getElementsByClassName("model");
    for (let i = 0; i < models.length; i++) {
      if (models[i].id == this.id) models[i].checked = true;
      else models[i].checked = false;
    }
    GLOBALS.selected_model = this.id;
    // 使用するmodelのパラメータを表示するHTMLに切り替える
    if (this.id == "SOM") {
      document.getElementById("resolution-nodes").style.display = "";
      document.getElementById("sigmax").style.display = "";
      document.getElementById("sigmin").style.display = "";
      document.getElementById("tau").style.display = "";
      document.getElementById("eta").style.display = "none";
      document.getElementById("mapping-resolution").style.display = "none";
    } else {
      document.getElementById("resolution-nodes").style.display = "none";
      document.getElementById("sigmax").style.display = "none";
      document.getElementById("sigmin").style.display = "none";
      document.getElementById("tau").style.display = "none";
      document.getElementById("eta").style.display = "";
      document.getElementById("mapping-resolution").style.display = "";
    }
    // 特にdemoが動いてない時は，何もしない（後で変えるかも）
    if (GLOBALS.playgroundDemo != null) {
      setRunning(false);
      // playからpauseアイコンに切り替える
      var play_pause = d3.select("#play_pause");
      var icon = "pause";
      play_pause.select("i").remove();
      play_pause.append("i").attr("class", "material-icons");
      play_pause.select("i").node().innerHTML = icon;
      // demoの設定
      var demo = demos[GLOBALS.selected_id];
      var params = [parseInt(document.getElementById("data-slider").value)];
      if (demo.options[1])
        params.push(d3.select("#dataDim-slider").node().value);
      if (demo.options[2]) params.push(demo.options[2].start);
      if (demo.options[3]) params.push(demo.options[3].start);
      var points = demo.generator.apply(null, params);
      main(points);
    }
  }
  document.getElementById("SOM").addEventListener("change", model_select);
  document.getElementById("UKR").addEventListener("change", model_select);
};
