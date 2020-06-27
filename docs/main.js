if (typeof require != "undefined") {
  var somjs = require("./som.js");
  var ukrjs = require("./ukr.js");
}

var GLOBALS = {
  playgroundDemo: null, // the object to control running the playground simulation
  running: true,
  state: {},
  showDemo: null,
  selected_model: "UKR",
  selected_id: 0,
  visibility: "off",
  current_Z: null,
  current_Y: null,
  figure: {
    width: 300,
    height: 300,
  },
};

d3.select("#play_pause").on("click", () => {
  var play_pause = d3.select("#play_pause");

  // step >= GLOBALS.state.epochのとき，何もしない
  // 見やすくするためにstepが1,000のように点が含まれているので前処理で取り除く
  var step = parseInt(d3.select("#step").node().innerText.split(",").join(""));
  if (step >= GLOBALS.state.epoch) return;

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
    var points = demo.generator.apply(null, GLOBALS.state.demoParams);
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
      var figure = d3.select("#figure");
      figure.append("div").attr("id", "svg_observation").attr("class", "a");
      figure.select("#svg_observation").node().innerHTML = "observation space";
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
    var x;
    var demo = demos[GLOBALS.selected_id];
    var demoParams = "";
    for (let i = 0; i < demo.options.length; i++) {
      demoParams += GLOBALS.state.demoParams[i] + ",";
    }

    var modelParams =
      GLOBALS.selected_model == "UKR"
        ? GLOBALS.state.ukrParams
        : GLOBALS.state.somParams;
    x = {
      selected_model: GLOBALS.selected_model,
      selected_id: GLOBALS.selected_id,
      demoParams: demoParams,
      epoch: GLOBALS.state.epoch,
      ldim: GLOBALS.state.ldim,
      ...modelParams,
    };
  }
  d3.select("#share")
    .style("display", "")
    .attr("href", "#" + generateHash(x));
}

function generateHash(x) {
  function stringify(map) {
    var s = "";
    for (key in map) {
      s += "&" + key + "=" + map[key];
    }
    return s.substring(1);
  }
  return stringify(x);
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

function makeDemoParamsSlider() {
  var demoParamsName = "demo-params";
  if (GLOBALS.playgroundDemo != null) {
    // 前回のdemo-paramsスライダーをすべて消す
    for (let i = 0; i < 5; i++) {
      var name = "#" + demoParamsName + String(i);
      d3.select(name).selectAll("td").remove();
    }
  }
  var demo = demos[GLOBALS.selected_id];
  // 引数が６個以上ある場合は，エラーとして処理する
  if (demo.options.length > 5)
    throw new Error("Not implimented Error (demo-options.length > 5)");
  // demo.option[i]のsliderの設定を行う
  for (let i = 0; i < demo.options.length; i++) {
    var x = d3.select("#" + demoParamsName + String(i));
    var y = "current-" + String(demo.options[i].name.split(" ").join(""));
    var z = demo.options[i];
    // 1つ目のtdタグには，スライダーの現在値を表示する
    x.append("td").append("span").attr("id", y);
    // 起動初回時かつ，URLにhashでパラメータが指定されている時
    var firstBoot_urlHash =
      GLOBALS.playgroundDemo == null && location.hash != "";
    if (firstBoot_urlHash) {
      // 事前にGLOBALS.state.demoParamsにURLのhashがあるとすると
      d3.select("#" + y).node().innerText =
        z.name + " " + GLOBALS.state.demoParams[i];
    } else {
      // 起動初回でURLにhashがないとき，あるいは既にdemoが行われているとき
      d3.select("#" + y).node().innerText = z.name + " " + z.start;
    }
    // console.log(d3.select("#" + y).node());
    // 2つ目のtdタグには，range sliderを生成する
    var step01list = ["StdOfGaussianNoise", "Factor"];
    x.append("td")
      .append("input")
      .attr("id", y + "-slider")
      .attr("type", "range")
      .attr(
        // この書き方はかなり無理矢理なのでもっといい方法がないか検討する必要がある
        "step",
        step01list.includes(demo.options[i].name.split(" ").join(""))
          ? 0.01
          : 1.0
      )
      .attr("min", z.min)
      .attr("max", z.max)
      .attr(
        "defaultValue",
        firstBoot_urlHash ? GLOBALS.state.demoParams[i] : z.start
      )
      .attr("value", firstBoot_urlHash ? GLOBALS.state.demoParams[i] : z.start)
      .on("input", () => {
        // playからpauseアイコンに切り替える
        var play_pause = d3.select("#play_pause");
        var icon = "pause";
        play_pause.select("i").remove();
        play_pause.append("i").attr("class", "material-icons");
        play_pause.select("i").node().innerHTML = icon;
        // スライダーの値が変更されたときに，GLOBALS.stateに値を反映
        // して，値を1つめのtdタグのinnerTextに更新する
        var s = "current-" + String(demo.options[i].name.split(" ").join(""));
        var value = d3.select("#" + s + "-slider").node().value;
        // 前回のGLOBALS.state.demoParamsをすべて消す
        GLOBALS.state.demoParams = [];
        // 全てのdemoParamsを更新する
        for (let j = 0; j < demo.options.length; j++) {
          var ss =
            "current-" + String(demo.options[j].name.split(" ").join(""));
          var v = d3.select("#" + ss + "-slider").node().value;
          GLOBALS.state.demoParams.push(parseFloat(v));
        }
        d3.select("#" + s).node().innerText =
          demo.options[i].name + " " + value;
        // スライダーが変化したときに更新後のdemoを再生する
        var points = demo.generator.apply(null, GLOBALS.state.demoParams);
        main(points);
      });
  }
}

function runDemo() {
  setRunning(false);
  // playからpauseアイコンに切り替える
  var play_pause = d3.select("#play_pause");
  var icon = "pause";
  play_pause.select("i").remove();
  play_pause.append("i").attr("class", "material-icons");
  play_pause.select("i").node().innerHTML = icon;
  // demoの設定を行う
  var demo = demos[GLOBALS.selected_id];
  var params = [];
  for (let j = 0; j < demo.options.length; j++) {
    params.push(GLOBALS.state.demoParams[j]);
  }
  var points = demo.generator.apply(null, params);
  main(points);
}

function makeModelParamsSlider() {
  var demoParamsTag = d3.select("#demo-params");
  // selected_modelの前回の履歴を消す（いらないかも）
  //
  // var model = GLOBALS.selected_model;
  // 起動時のみ，modelParams用のsliderを生成する
  if (GLOBALS.playgroundDemo == null) {
    // epochとldimはukr, somともに共通
    model_slider = {
      epoch: {
        min: 1,
        max: 2000,
        step: 1,
      },
      ldim: {
        min: 1,
        max: 2,
        step: 1,
      },
    };
    // ukr sliderの初期設定用の連想配列
    ukr_slider = {
      eta: {
        min: 0.01,
        max: 50,
        step: 0.01,
      },
      mapping_reso: {
        min: 2,
        max: 50,
        step: 1,
      },
    };
    // som sliderの初期設定用の連想配列
    som_slider = {
      node_reso: {
        min: 1,
        max: 50,
        step: 1,
      },
      sigmax: {
        min: 0.01,
        max: 4,
        step: 0.01,
      },
      sigmin: {
        min: 0.01,
        max: 4,
        step: 0.01,
      },
      tau: {
        min: 2,
        max: 2000,
        step: 1,
      },
    };
    // epochとldimに関して，ここでsliderを作る
    var keys_epoch_ldim = ["epoch", "ldim"];
    for (let i = 0; i < 2; i++) {
      var tr = demoParamsTag.append("tr").attr("id", keys_epoch_ldim[i]);
      // 1つ目の<td>は数字の表示用
      tr
        .append("td")
        .append("span")
        .attr("id", "curr-" + keys_epoch_ldim[i])
        .node().innerText =
        keys_epoch_ldim[i] + " " + GLOBALS.state[keys_epoch_ldim[i]];
      // 2つ目の<td>はrange slider用
      tr.append("td")
        .append("input")
        .attr("id", keys_epoch_ldim[i] + "-slider_")
        .attr("type", "range")
        .attr("min", model_slider[keys_epoch_ldim[i]].min)
        .attr("max", model_slider[keys_epoch_ldim[i]].max)
        .attr("step", model_slider[keys_epoch_ldim[i]].step)
        .attr("value", GLOBALS.state[keys_epoch_ldim[i]])
        .on("change", () => {
          var value = d3.select("#" + keys_epoch_ldim[i] + "-slider_").node()
            .value;
          d3.select("#curr-" + keys_epoch_ldim[i]).node().innerText =
            keys_epoch_ldim[i] + " " + String(value);
          GLOBALS.state[keys_epoch_ldim[i]] = parseFloat(value);
          console.log(GLOBALS.state[keys_epoch_ldim[i]]);
          runDemo();
        });
    }
    var keys_ukr = Object.keys(GLOBALS.state.ukrParams).sort();
    for (let i = 0; i < keys_ukr.length; i++) {
      var tr = demoParamsTag
        .append("tr")
        .attr("id", keys_ukr[i])
        .attr("class", "UKR")
        .attr(
          "style",
          GLOBALS.selected_model == "UKR" ? "display:" : "display:none;"
        );
      // 1つ目の<td>は数字の表示用
      tr
        .append("td")
        .append("span")
        .attr("id", "curr-" + keys_ukr[i])
        .node().innerText =
        keys_ukr[i] + " " + GLOBALS.state.ukrParams[keys_ukr[i]];
      // 2つ目の<td>はrange slider用
      tr.append("td")
        .append("input")
        .attr("id", keys_ukr[i] + "-slider_")
        .attr("type", "range")
        .attr("min", ukr_slider[keys_ukr[i]].min)
        .attr("max", ukr_slider[keys_ukr[i]].max)
        .attr("step", ukr_slider[keys_ukr[i]].step)
        .attr("value", GLOBALS.state.ukrParams[keys_ukr[i]])
        .on("change", () => {
          var value = d3.select("#" + keys_ukr[i] + "-slider_").node().value;
          d3.select("#curr-" + keys_ukr[i]).node().innerText =
            keys_ukr[i] + " " + String(value);
          GLOBALS.state.ukrParams[keys_ukr[i]] = parseFloat(value);
          console.log(GLOBALS.state.ukrParams);
          runDemo();
        });
    }
    var keys_som = Object.keys(GLOBALS.state.somParams).sort();
    for (let i = 0; i < keys_som.length; i++) {
      var tr = demoParamsTag
        .append("tr")
        .attr("id", keys_som[i])
        .attr("class", "SOM")
        .attr(
          "style",
          GLOBALS.selected_model == "SOM" ? "display:" : "display:none;"
        );
      // １つ目の<td>は数字の表示用
      tr
        .append("td")
        .append("span")
        .attr("id", "curr-" + keys_som[i])
        .node().innerText =
        keys_som[i] + " " + GLOBALS.state.somParams[keys_som[i]];
      // 2つ目の<td>はrange slider用
      tr.append("td")
        .append("input")
        .attr("id", keys_som[i] + "-slider_")
        .attr("type", "range")
        .attr("min", som_slider[keys_som[i]].min)
        .attr("max", som_slider[keys_som[i]].max)
        .attr("step", som_slider[keys_som[i]].step)
        .attr("value", GLOBALS.state.somParams[keys_som[i]])
        .on("change", () => {
          var value = d3.select("#" + keys_som[i] + "-slider_").node().value;
          console.log(value);
          d3.select("#curr-" + keys_som[i]).node().innerText =
            keys_som[i] + " " + String(value);
          GLOBALS.state.somParams[keys_som[i]] = parseFloat(value);
          console.log(GLOBALS.state.somParams);
          runDemo();
        });
    }
  } else {
    // 2度目以降に呼び出されたときの処理
    // console.log(GLOBALS.selected_model);
    if (GLOBALS.selected_model == "UKR") {
      d3.selectAll(".SOM").attr("style", "display:none;");
      d3.selectAll(".UKR").attr("style", "display: ;");
    } else {
      d3.selectAll(".UKR").attr("style", "display:none;");
      d3.selectAll(".SOM").attr("style", "display: ;");
    }
    d3.select("#epoch").attr("style", "display:");
    d3.select("#ldim").attr("style", "display:");
  }
}

// Create menu of possible demos.
var menuDiv = d3.select("#data-menu");
var dataMenus = menuDiv
  .selectAll(".demo-data")
  .data(demos)
  .enter()
  .append("div")
  .classed("demo-data", true)
  .on("click", function (_, i) {
    // playからpauseアイコンに切り替える
    var play_pause = d3.select("#play_pause");
    var icon = "pause";
    play_pause.select("i").remove();
    play_pause.append("i").attr("class", "material-icons");
    play_pause.select("i").node().innerHTML = icon;
    // demos[i]をselectedに変更する
    d3.selectAll(".demo-data").classed("selected", (_, j) => {
      return i == j;
    });
    // demoの設定を行う
    GLOBALS.selected_id = i;
    var demo = demos[i];

    // demoの説明文をdemo-descriptionに反映する
    d3.select("#demo-description").node().innerText = demo.description;

    // demoの引数を全て読み込む
    var params = [];
    for (let j = 0; j < demo.options.length; j++) {
      params.push(demo.options[j].start);
    }
    // GLOBALS.state.demoParamsにも反映する
    GLOBALS.state.demoParams = params;

    // demo用のスライダーを作成する
    makeDemoParamsSlider();

    // demoに引数を渡してデータを生成する
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
  tau,
  eta,
  mapping_resolution,
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
  if (GLOBALS.selected_model == "UKR") {
    ukr = new ukrjs.UKR();
  } else {
    som = new somjs.SOM();
  }

  function stepCb(step) {
    var format = d3.format(",");
    d3.select("#step").text(format(step));
    if (step >= GLOBALS.state.epoch) {
      setRunning(false);
      var play_pause = d3.select("#play_pause");
      var icon = "play_arrow";
      play_pause.select("i").remove();
      play_pause.append("i").attr("class", "material-icons");
      play_pause.select("i").node().innerHTML = icon;
    }
  }

  function iterate() {
    if (paused) return;

    // 画面が変更されたときにfigureサイズを変更するために用意
    figureSizeUpdate();

    // control speed at which we iterate
    if (step >= 200 || Dim == 3) chunk = 1;
    for (var k = 0; k < chunk; k++) {
      // SOM
      if (GLOBALS.selected_model == "SOM") {
        sigma = calc_sigma(step, tau, sigmax, sigmin);
        Y = som.estimate_f(X, Y, Z, Zeta, sigma);
        Z = som.estimate_z(X, Y, Z, Zeta);
      } else {
        // UKR
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
      visualize_latent_space(
        (Z = Z),
        (Zeta = Zeta),
        (width = GLOBALS.figure.width),
        (height = GLOBALS.figure.height),
        (margin = margin)
      );
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
    // 前回のdemoの観測空間の描画を削除
    d3.select("#figure").select("#svg_observation").remove();
    d3.select("#figure")
      .append("div")
      .attr("id", "svg_observation")
      .classed("a", true);
  }

  const N = GLOBALS.state.demoParams[0];
  const K = GLOBALS.state.somParams["node_reso"];
  const ldim = GLOBALS.state.ldim;
  const sigmax = GLOBALS.state.somParams["sigmax"];
  const sigmin = GLOBALS.state.somParams["sigmin"];
  const tau = GLOBALS.state.somParams["tau"];
  const eta = GLOBALS.state.ukrParams["eta"];
  const mapping_resolution = GLOBALS.state.ukrParams["mapping_reso"];

  Dim = X[0].coords.length;
  Zdim = ldim;

  let Z = initMatrix(X.length, Zdim);
  for (let n = 0; n < X.length; n++) {
    // XとZが指すcolorを統一する
    Z[n].color = X[n].color;
  }

  var Y, Zeta;
  if (GLOBALS.selected_model == "SOM") {
    Zeta = create_zeta(K, Zdim);
    Y = initMatrix(Zeta.length, Dim);
  } else {
    Y = initMatrix(X.length, Dim);
  }

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
    tau,
    eta,
    mapping_resolution,
    margin
  );
}

function figureSizeUpdate() {
  // var size_ = document.getElementById("playground").style;
  var figure = document.getElementById("figure");
  var w = figure.clientWidth;
  var h = figure.clientHeight;
  // GLOBALS.figure.width = Math.min(w, h);
  // GLOBALS.figure.height = Math.min(w, h);
  GLOBALS.figure.width = 400;
  GLOBALS.figure.height = 400;
  // console.log(GLOBALS.figure);
  // console.log(size_.grid);
}

window.onload = () => {
  //radio button's setting
  function model_select() {
    var models = document.getElementsByClassName("model");
    for (let i = 0; i < models.length; i++) {
      if (models[i].id == this.id) models[i].checked = true;
      else models[i].checked = false;
    }
    // selected_idとstate.selected_idが重複しているので要修正
    GLOBALS.selected_model = this.id;
    // model-paramsの表示を新しいモデル名に変更する
    document.getElementById("model-params").innerHTML =
      "[" + this.id + " params]";
    // UKRとSOMのスライダーを切り替える
    makeModelParamsSlider();
    // playからpauseアイコンに切り替える
    var play_pause = d3.select("#play_pause");
    var icon = "pause";
    play_pause.select("i").remove();
    play_pause.append("i").attr("class", "material-icons");
    play_pause.select("i").node().innerHTML = icon;
    // demoの設定
    var demo = demos[GLOBALS.selected_id];
    var params = [];
    for (let j = 0; j < demo.options.length; j++) {
      params.push(GLOBALS.state.demoParams[j]);
    }
    var points = demo.generator.apply(null, params);
    main(points);
  }
  document.getElementById("SOM").addEventListener("change", model_select);
  document.getElementById("UKR").addEventListener("change", model_select);

  // 初回起動時にdemoを再生する
  // playからpauseアイコンに切り替える
  var play_pause = d3.select("#play_pause");
  var icon = "pause";
  play_pause.select("i").remove();
  play_pause.append("i").attr("class", "material-icons");
  play_pause.select("i").node().innerHTML = icon;

  // shareされたURLのハッシュ部分からパラメータを引き継ぐ
  function setStateFromLocationHash() {
    // 起動初回時のみパラメータを引き継ぐ
    // パラメータがない場合は，用意しておいたdemoを再生する
    if (GLOBALS.playgroundDemo == null) {
      var params = {};
      window.location.hash
        .substring(1)
        .split("&")
        .forEach(function (p) {
          var tokens = p.split("=");
          params[tokens[0]] = tokens[1];
        });
      function getParam(key, fallback) {
        return params[key] === undefined ? fallback : params[key];
      }
      GLOBALS.selected_model = getParam("selected_model", "UKR");
      GLOBALS.selected_id = parseFloat(getParam("selected_id", 0));
      // demoのパラメータはデータによって異なるのでdataParamsで一括にして扱う
      GLOBALS.state = {
        // demoのパラメータはデータによって異なるのでdataParamsで一括にして扱う
        demoParams: getParam("demoParams", "100,10,5").split(",").map(Number),
        // モデルのパラメータ
        ldim: parseFloat(getParam("ldim", 2)),
        epoch: parseFloat(getParam("epoch", 1000)),
      };
      GLOBALS.state.ukrParams = {
        eta: parseFloat(getParam("eta", 2)),
        mapping_reso: parseFloat(getParam("mapping_reso", 10)),
      };
      GLOBALS.state.somParams = {
        node_reso: parseFloat(getParam("node_reso", 20)),
        sigmax: parseFloat(getParam("sigmax", 2.2)),
        sigmin: parseFloat(getParam("sigmin", 0.2)),
        tau: parseFloat(getParam("tau", 900)),
      };
      // console.log(GLOBALS);
    }
  }

  // URLにhashがついていない場合は，用意しておいたデモを再生する
  // hashがついている場合は，そのhash通りのパラメータでデモを再生する
  setStateFromLocationHash();
  // radio buttonの初期位置を決める
  var models = document.getElementsByClassName("model");
  for (let i = 0; i < models.length; i++) {
    if (models[i].id == GLOBALS.selected_model) models[i].checked = true;
    else models[i].checked = false;
  }
  // model-paramsの表示を新しいモデル名に変更する
  document.getElementById("model-params").innerHTML =
    "[" + GLOBALS.selected_model + " params]";
  // demo用のスライダーを作成する
  makeDemoParamsSlider();
  // model用のスライダーを作成する
  makeModelParamsSlider();
  // demos[GLOBALS.selected_id]をselectedに変更する
  d3.selectAll(".demo-data").classed("selected", (_, j) => {
    return GLOBALS.selected_id == j;
  });
  // demoの設定
  var demo = demos[GLOBALS.selected_id];
  // demoの説明文をdemo-descriptionに反映する
  d3.select("#demo-description").node().innerText = demo.description;
  var params = [];
  for (let i = 0; i < demo.options.length; i++)
    params.push(GLOBALS.state.demoParams[i]);
  var points = demo.generator.apply(null, params);
  // main(points);
  figureSizeUpdate();
};

window.onresize = () => {
  figureSizeUpdate();
  // console.log(document.getElementById("figure").clientWidth);
};
