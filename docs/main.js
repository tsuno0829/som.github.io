function init() {
    const data = parseInt(document.getElementById("data-slider").value)
    const node = parseInt(document.getElementById("node-slider").value)
    const sigmax = parseFloat(document.getElementById("sigmax-slider").value)
    const sigmin = parseFloat(document.getElementById("sigmin-slider").value)
    const epoch = parseFloat(document.getElementById("epoch-slider").value)
    const tau = parseFloat(document.getElementById("tau-slider").value)
    document.getElementById("current-data").innerHTML = data
    document.getElementById("current-node").innerHTML = node
    document.getElementById("current-sigmax").innerHTML = sigmax
    document.getElementById("current-sigmin").innerHTML = sigmin
    document.getElementById("current-epoch").innerHTML = epoch
    document.getElementById("current-tau").innerHTML = tau
    return [data, node, sigmax, sigmin, epoch, tau]
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
    if (dim > 2) throw new Error("Dim must be 1 or 2.")

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

function calc_sqeuclid_dist(x, y) {
    // x: (N, D), y: (K, D)
    let N = x.length
    let K = y.length
    let D = x[0].coords.length
    let dist_arr = []
    for (let n = 0; n < N; n++) {
        let tmp = []
        for (let k = 0; k < K; k++) {
            let dist = 0
            for (let d = 0; d < D; d++) {
                dist += Math.pow(x[n].coords[d] - y[k].coords[d], 2)
            }
            tmp.push(dist)
        }
        dist_arr.push(tmp)
    }
    return dist_arr
}


function estimate_f(X, Y, z, zeta, sigma) {
    let N = z.length
    let K = zeta.length
    let D = X[0].coords.length
    let h = []
    let H = []

    dist = calc_sqeuclid_dist(z, zeta)

    for (let n = 0; n < N; n++) {
        let tmp = []
        for (let k = 0; k < K; k++) {
            let t = Math.exp(-0.5*(dist[n][k])/(sigma*sigma))
            tmp.push(t)
        }
        h.push(tmp)
    }

    for (let k = 0; k < K; k++) {
        let sum = 0
        for (let n = 0; n < N; n++) {
            sum += h[n][k]
        }
        H.push(sum)
    }

    for (let k = 0; k < K; k++) {
        let y = [0, 0]
        for (let n = 0; n < N; n++) {
            for (let d = 0; d < D; d++) {
                y[d] += h[n][k] * X[n].coords[d] / H[k]
            }
        }
        Y[k].coords = y
    }
    return Y
}

function estimate_z(X, Y, Z, Zeta) {
    let N = Z.length
    let dist = calc_sqeuclid_dist(X, Y)
    for (let n = 0; n < N; n++) {
        min_zeta_idx = argMin(dist[n])
        Z[n].coords = Zeta[min_zeta_idx].coords
        Z[n].color = Zeta[min_zeta_idx].color
    }
    return Z
}

function visualize_latent_space(Z, Zeta, margin, width, height) {
    d3.select("#svg_latent").select("svg").remove();

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
        .text("X Label");

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
        .text("Y Label");

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

function visualize_observation_space(X, Y, margin, width, height) {
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
        .text("X Label");

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
        .text("Y Label");

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
        .attr("r", 4);

    // line作成関数
    var curveFunc = d3.line()
    .curve(d3.curveLinear) // curveメソッドで線の形を変更
    .x(function(d) { return xScale(d.coords[0]) })
    .y(function(d) { return yScale(d.coords[1]) })

    // Path追加
    svg_f.append('path')
    .attr('d', curveFunc(Y))
    .attr('stroke', 'red')
    .attr("stroke-width", 2)
    .attr('fill', 'none')
}

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function main() {
    const [N, K, sigmax, sigmin, nb_epoch, tau] = init()
    // let X = gridData(N)
    let X = sinData(N)
    const Zeta = create_zeta(K, 1)
    let Z =  initMatrix(X.length, 1)
    let Y = initMatrix(K, 2)
    var width = 300
    var height = 300
    var margin = { "top": 30, "bottom": 60, "right": 30, "left": 60 }

    for (let epoch = 0; epoch < nb_epoch; epoch++) {
        document.getElementById("current-step").innerHTML = epoch + 1
        sigma = calc_sigma(epoch, tau, sigmax, sigmin)
        Y = estimate_f(X, Y, Z, Zeta, sigma)
        Z = estimate_z(X, Y, Z, Zeta)
        visualize_latent_space(Z, Zeta, margin, width, height)
        visualize_observation_space(X, Y, margin, width, height)
        await sleep(100)
    }
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
    const current_sigmax = document.getElementById("current-sigmax")
    const current_sigmin = document.getElementById("current-sigmin")
    const current_epoch = document.getElementById("current-epoch")
    const current_tau = document.getElementById("current-tau")
    const setCurrentValue = (c) => (e) => {c.innerText = e.target.value}
    document.getElementById("data-slider").addEventListener("input", setCurrentValue(current_data))
    document.getElementById("node-slider").addEventListener("input", setCurrentValue(current_node))
    document.getElementById("sigmax-slider").addEventListener("input", setCurrentValue(current_sigmax))
    document.getElementById("sigmin-slider").addEventListener("input", setCurrentValue(current_sigmin))
    document.getElementById("epoch-slider").addEventListener("input", setCurrentValue(current_epoch))
    document.getElementById("tau-slider").addEventListener("input", setCurrentValue(current_tau))
}