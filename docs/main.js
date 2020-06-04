function init() {
    const data = parseInt(document.getElementById("data-slider").value)
    const node = parseInt(document.getElementById("node-slider").value)
    const sigmax = parseFloat(document.getElementById("sigmax-slider").value)
    const sigmin = parseFloat(document.getElementById("sigmin-slider").value)
    document.getElementById("current-data").innerHTML = data
    document.getElementById("current-node").innerHTML = node
    document.getElementById("current-sigmax").innerHTML = sigmax
    document.getElementById("current-sigmin").innerHTML = sigmin
    return [data, node, sigmax, sigmin]
}

function initMatrix(N, dim) {
    let arr1 = []
    for (let i = 0; i < N; i++) {
        let arr2 = []
        for (let j = 0; j < dim; j++) {
            arr2.push(Math.random() * 2 - 1)
        }
        arr1.push(arr2)
    }
    return arr1
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

function create_sin(N) {
    let arr = []
    for (let i = 0; i < N; i++) {
        let r = Math.random() * 6 - 3
        arr.push([r, Math.sin(r)])
    }
    return arr
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
    return arr
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
        .attr("cx", function(d) { return xScale(d[0]); })
        .attr("cy", function(d) { return yScale(d[1]); })
        .attr("fill", "white")
        .attr("stroke", "red")
        .attr("stroke-width", 1)
        .attr("r", 4);

    svg_f.append("g")
        .selectAll("circle")
        .data(Z)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d[0]); })
        .attr("cy", function(d) { return yScale(d[1]); })
        .attr("fill", "steelblue")
        .attr("r", 4);
}

function visualize_observation_space(X, margin, width, height) {
    d3.select("#svg_observation").select("svg").remove();

    var svg_f = d3.select("#svg_observation").append("svg").attr("width", width).attr("height", height)

    var xScale = d3.scaleLinear()
    .domain([d3.min(X, function(d){return d[0]})-1, d3.max(X, function(d){return d[0]})+1])
    .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
    .domain([-2, 2])
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
        .data(X)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d[0]); })
        .attr("cy", function(d) { return yScale(d[1]); })
        .attr("fill", "steelblue")
        .attr("r", 4);
}

function main() {
    const [N, K, sigmax, sigmin] = init()
    const X = create_sin(N)
    const Zeta = create_zeta(K, 1)
    let Z =  initMatrix(N, 2)
    var width = 500
    var height = 400
    var margin = { "top": 30, "bottom": 60, "right": 30, "left": 60 };

    visualize_latent_space(Z, Zeta, margin, width, height)
    visualize_observation_space(X, margin, width, height)
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
    const setCurrentValue = (c) => (e) => {c.innerText = e.target.value}
    document.getElementById("data-slider").addEventListener("input", setCurrentValue(current_data))
    document.getElementById("node-slider").addEventListener("input", setCurrentValue(current_node))
    document.getElementById("sigmax-slider").addEventListener("input", setCurrentValue(current_sigmax))
    document.getElementById("sigmin-slider").addEventListener("input", setCurrentValue(current_sigmin))
}