if(typeof require != "undefined") {
    var somjs = require('./som.js')
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
}

function init() {
    const data = parseInt(document.getElementById("data-slider").value)
    const node = parseInt(document.getElementById("node-slider").value)
    const ldim = parseInt(document.getElementById("ldim-slider").value)
    const sigmax = parseFloat(document.getElementById("sigmax-slider").value)
    const sigmin = parseFloat(document.getElementById("sigmin-slider").value)
    const epoch = parseFloat(document.getElementById("epoch-slider").value)
    const tau = parseFloat(document.getElementById("tau-slider").value)
    document.getElementById("current-data").innerHTML = data
    document.getElementById("current-node").innerHTML = node
    document.getElementById("current-ldim").innerHTML = ldim
    document.getElementById("current-sigmax").innerHTML = sigmax
    document.getElementById("current-sigmin").innerHTML = sigmin
    document.getElementById("current-epoch").innerHTML = epoch
    document.getElementById("current-tau").innerHTML = tau
    return [data, node, ldim, sigmax, sigmin, epoch, tau]
}

// Gaussian generator, mean = 0, std = 1.
var normal = d3.randomNormal();

// Create random Gaussian vector.
function normalVector(dim) {
    var p = [];
    for (var j = 0; j < dim; j++) {
        p[j] = normal();
    }
    return p;
}

// Scale the given vector.
function scale(vector, a) {
    for (var i = 0; i < vector.length; i++) {
      vector[i] *= a;
    }
}

// Standard Normal variate using Box-Muller transform.
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

function linspace(startValue, stopValue, cardinality, endpoint=false) {
    var arr = [];
    if (endpoint) var step = (stopValue - startValue) / (cardinality - 1);
    else var step = (stopValue - startValue - 1) / (cardinality - 1);

    for (var i = 0; i < cardinality; i++) {
      arr.push(startValue + (step * i));
    }
    return arr;
}

const transpose = a => a[0].map((_, c) => a.map(r => r[c]));

function splitArray(array, part) {
    var tmp = [];
    for(var i = 0; i < array.length; i += part) {
        tmp.push(array.slice(i, i + part));
    }
    return tmp;
}

// A point with color info.
var Point = function(coords, color) {
    this.coords = coords;
    this.color = color || '#039';
};

// Convenience function to wrap 2d arrays as Points, using a default
// color scheme.
function makePoints(originals) {
    var points = originals.map(function(p) {return new Point(p);});
    addSpatialColors(points);
    return points;
}

// Adds colors to points depending on 2D location of original.
function addSpatialColors(points) {
    var xExtent = d3.extent(points, function(p) {return p.coords[0]});
    var yExtent = d3.extent(points, function(p) {return p.coords[1]});
    var xScale = d3.scaleLinear().domain(xExtent).range([0, 255]);
    var yScale = d3.scaleLinear().domain(yExtent).range([0, 255]);
    points.forEach(function(p) {
        var c1 = ~~xScale(p.coords[0]);
        var c2 = ~~yScale(p.coords[1]);
        p.color = 'rgb(20,' + c1 + ',' + c2 + ')';
    });
}

function initMatrix(N, dim) {
    if (dim > 2){
        // console.log(dim)
        throw new Error(dim)
    }

    let arr1 = []
    if (dim == 1) {
        for (let i = 0; i < N; i++) {
            arr1.push([randn_bm()*0.01, 0])
        }
    } else {
        for (let i = 0; i < N; i++) {
            let arr2 = []
            for (let j = 0; j < dim; j++) {
                arr2.push(randn_bm()*0.01)
            }
            arr1.push(arr2)
        }
    }
    return makePoints(arr1)
}

// Data in shape of 2D grid.
function gridData(size) {
    let points = [];
    for (var x = 0; x < size; x++) {
        for (var y = 0; y < size; y++) {
            points.push([x-~~size/2, y-~~size/2]);
        }
    }
    return makePoints(points);
}

function sinData(N) {
    let points = []
    for (let i = 0; i < N; i++) {
        let r = Math.random() * 6 - 3
        points.push([r, Math.sin(r)])
    }
    return makePoints(points)
}

// Two clusters of the same size.
function twoClustersData(n, dim) {
    dim = dim || 50;
    var points = [];
    for (var i = 0; i < n; i++) {
        points.push(new Point(normalVector(dim), '#039'));
        var v = normalVector(dim);
        v[0] += 10;
        points.push(new Point(v, '#f90'));
    }
    return points;
}

// Three clusters, at different distances from each other, in any dimension.
function threeClustersData(n, dim) {
    dim = dim || 50;
    var points = [];
    for (var i = 0; i < n; i++) {
        var p1 = normalVector(dim);
        points.push(new Point(p1, '#039'));
        var p2 = normalVector(dim);
        p2[0] += 10;
        points.push(new Point(p2, '#f90'));
        var p3 = normalVector(dim);
        p3[0] += 50;
        points.push(new Point(p3, '#6a3'));
    }
    return points;
}

  // One tiny cluster inside of a big cluster.
function subsetClustersData(n, dim) {
    dim = dim || 2;
    var points = [];
    for (var i = 0; i < n; i++) {
        var p1 = normalVector(dim);
        points.push(new Point(p1, '#039'));
        var p2 = normalVector(dim);
        scale(p2, 50);
        points.push(new Point(p2, '#f90'));
    }
    return points;
}

function create_zeta(K, Dim) {
    // create grid with [-1, 1]^Dim
    if (Dim > 2) throw new Error("Dim must be 1 or 2.")

    let arr = []
    let grid = linspace(-1, 1, K, endpoint=true)

    if (Dim == 1) {
        for (let k = 0; k < K; k++) {
            arr.push([grid[k], 0])
        }
    } else {
        for (let k = 0; k < K; k++) {
            for (let l = 0; l < K; l++) {
                arr.push([grid[k], grid[l]])
            }
        }
    }
    return makePoints(arr)
}

function argMin(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1];
}

function calc_sigma(t, tau, sigmax, sigmin) {
    return Math.max(sigmax-(sigmax-sigmin)*(t/tau), sigmin)
}

function visualize_latent_space(Z, Zeta, width, height, margin) {
    // console.log(Z)
    // console.log(Zeta)
    d3.select("#svg_latent").select("svg").remove();

    // console.log(width)
    // console.log(height)

    var svg_f = d3.select("#svg_latent").append("svg").attr("width", width).attr("height", height)

    var xScale = d3.scaleLinear()
    .domain([-1.1, 1.1])
    .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
    .domain([-1.1, 1.1])
    .range([height - margin.bottom, margin.top]);

    var axisx = d3.axisBottom(xScale).ticks(5);
    var axisy = d3.axisLeft(yScale).ticks(5);

    svg_f.append("g")
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

    svg_f.append("g")
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

    svg_f.append("g")
        .selectAll("circle")
        .data(Zeta)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.coords[0]); })
        .attr("cy", function(d) { return yScale(d.coords[1]); })
        .attr("fill", "white")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("r", 4);

    svg_f.append("g")
        .selectAll("circle")
        .data(Z, (d) => {return d.coords})
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.coords[0]); })
        .attr("cy", function(d) { return yScale(d.coords[1]); })
        .attr("fill", d => d.color)
        .attr("r", 4);
}

function visualize_observation_space(X, Y, width, height, margin, IsWireframe) {
    d3.select("#svg_observation").select("svg").remove();

    var svg_f = d3.select("#svg_observation").append("svg").attr("width", width).attr("height", height)

    var xScale = d3.scaleLinear()
    .domain([d3.min(X, function(d){return d.coords[0]})-1, d3.max(X, function(d){return d.coords[0]})+1])
    .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
    .domain([d3.min(X, function(d){return d.coords[1]})-1, d3.max(X, function(d){return d.coords[1]})+1])
    .range([height-margin.bottom, margin.top])

    var axisx = d3.axisBottom(xScale).ticks(5);
    var axisy = d3.axisLeft(yScale).ticks(5);

    svg_f.append("g")
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

    svg_f.append("g")
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

    svg_f.append("g")
        .selectAll("circle")
        .data(X)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.coords[0]); })
        .attr("cy", function(d) { return yScale(d.coords[1]); })
        .attr("fill", d => d.color)
        .attr("r", 4);

    svg_f.append("g")
        .selectAll("circle")
        .data(Y)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.coords[0]); })
        .attr("cy", function(d) { return yScale(d.coords[1]); })
        .attr("fill", "red")
        .attr("r", 3);

    // line作成関数
    var curveFunc = d3.line()
    .curve(d3.curveLinear) // curveメソッドで線の形を変更
    .x(function(d) { return xScale(d.coords[0]) })
    .y(function(d) { return yScale(d.coords[1]) })
    if (IsWireframe==false) {
        // Path追加
        svg_f.append('path')
        .attr('d', curveFunc(Y))
        .attr('stroke', 'red')
        .attr("stroke-width", 2)
        .attr('fill', 'none')
    } else {
        let Y_reshape = splitArray(Y, ~~Math.sqrt(Y.length))
        for (let i = 0; i < Y_reshape.length; i++) {
            svg_f.append('path')
            .attr('d', curveFunc(Y_reshape[i]))
            .attr('stroke', 'red')
            .attr("stroke-width", 2)
            .attr('fill', 'none')
        }
        Y_transpose = transpose(Y_reshape)
        for (let i = 0; i < Y_transpose.length; i++) {
            svg_f.append('path')
            .attr('d', curveFunc(Y_transpose[i]))
            .attr('stroke', 'red')
            .attr("stroke-width", 2)
            .attr('fill', 'none')
        }
    }
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
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

function demoMaker(X, Y, Z, Zeta, N, K, ldim, sigmax, sigmin, nb_epoch, tau, width, height, margin, stepCb) {
    var demo = {};
    var paused = false;
    var step = 0;
    var chunk = 1;
    var frameId;

    var timescale = d3.scaleLinear()
    .domain([0, 20, 50, 100, 200, 6000])
    .range([60, 30, 20, 10, 0]);

    var som = new somjs.SOM();
    // var dists = distanceMatrix(points);
    // tsne.initDataDist(dists);

    function iterate() {
        if(paused) return;

        // control speed at which we iterate
        // if(step >= 200) chunk = 10;
        for(var k = 0; k < chunk; k++) {
            // tsne.step();
            sigma = calc_sigma(step, tau, sigmax, sigmin)
            Y = som.estimate_f(X, Y, Z, Zeta, sigma)
            Z = som.estimate_z(X, Y, Z, Zeta)
            step++;
        }

        //inform the caller about the current step
        stepCb(step)

        visualize_latent_space(Z, Zeta, width, height, margin)
        visualize_observation_space(X, Y, width, height, margin, Zdim==2)

        //control the loop.
        var timeout = timescale(step)
            setTimeout(function() {
            frameId = window.requestAnimationFrame(iterate);
        }, timeout)
    }

    demo.pause = function() {
      if(paused) return; // already paused
        paused = true;
        window.cancelAnimationFrame(frameId)
    }
    demo.unpause = function() {
      if(!paused) return; // already unpaused
        paused = false;
        iterate();
    }
    demo.paused = function() {
        return paused;
    }
    demo.destroy = function() {
        demo.pause();
        delete demo;
    }
    iterate();
    return demo;
}


function main() {
    if (GLOBALS.playgroundDemo != null) GLOBALS.playgroundDemo.destroy();
    var format = d3.format(",");
    const [N, K, ldim, sigmax, sigmin, nb_epoch, tau] = init()
    let X = gridData(N)
    // let X = twoClustersData(N, 2)
    // let X = threeClustersData(N, 2)
    // let X = subsetClustersData(N, 2)
    // let X = sinData(N)
    Dim = X[0].coords.length
    Zdim = ldim
    const Zeta = create_zeta(K, Zdim)
    let Z =  initMatrix(X.length, Zdim)
    for (let n = 0; n < X.length; n++) Z[n].color = X[n].color   // XとZが指すcolorを統一する
    let Y = initMatrix(Zeta.length, Dim)
    var width = 300
    var height = 300
    var margin = { "top": 30, "bottom": 60, "right": 30, "left": 60 }

    GLOBALS.playgroundDemo = demoMaker(X, Y, Z, Zeta, N, K, ldim, sigmax, sigmin, nb_epoch, tau,
                                        width, height, margin, function(step) {
        d3.select("#step").text(format(step));
        if(step >= GLOBALS.stepLimit) {
            setRunning(false)
        }
    })
}

try {
    main() // 起動時の表示
} catch(error) {
    console.log("ERROR")
}

document.getElementById("reset_btn").onclick = main

window.onload = () => {
    const current_data = document.getElementById("current-data")
    const current_node = document.getElementById("current-node")
    const current_ldim = document.getElementById("current-ldim")
    const current_sigmax = document.getElementById("current-sigmax")
    const current_sigmin = document.getElementById("current-sigmin")
    const current_epoch = document.getElementById("current-epoch")
    const current_tau = document.getElementById("current-tau")
    const setCurrentValue = (c) => (e) => {c.innerText = e.target.value}
    document.getElementById("data-slider").addEventListener("input", setCurrentValue(current_data))
    document.getElementById("node-slider").addEventListener("input", setCurrentValue(current_node))
    document.getElementById("ldim-slider").addEventListener("input", setCurrentValue(current_ldim))
    document.getElementById("sigmax-slider").addEventListener("input", setCurrentValue(current_sigmax))
    document.getElementById("sigmin-slider").addEventListener("input", setCurrentValue(current_sigmin))
    document.getElementById("epoch-slider").addEventListener("input", setCurrentValue(current_epoch))
    document.getElementById("tau-slider").addEventListener("input", setCurrentValue(current_tau))
}