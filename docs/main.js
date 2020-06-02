function init() {
    const data = parseInt(document.getElementById("data").value)
    const node = parseInt(document.getElementById("node").value)
    const sigmax = parseFloat(document.getElementById("sigmax").value)
    const sigmin = parseFloat(document.getElementById("sigmin").value)
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

function create_sin(N) {
    let arr = []
    for (let i = 0; i < N; i++) {
        let r = Math.random() * 6 - 3
        arr.push([r, Math.sin(r)])
    }
    return arr
}

function main() {
    const [N, K, sigmax, sigmin] = init()
    console.log(N, K, sigmax, sigmin)

    const X = create_sin(N)
    let Z =  initMatrix(data, 2)
    var width = 500
    var height = 400
    var margin = { "top": 30, "bottom": 60, "right": 30, "left": 60 };
    var svg = d3.select("body").append("svg").attr("width", width).attr("height", height)

    var xScale = d3.scaleLinear()
    .domain([d3.min(X, function(d){return d[0]})-1, d3.max(X, function(d){return d[0]})+1])
    .range([margin.left, width - margin.right]);

    var yScale = d3.scaleLinear()
    .domain([-2, 2])
    .range([height - margin.bottom, margin.top]);

    var axisx = d3.axisBottom(xScale).ticks(5);
    var axisy = d3.axisLeft(yScale).ticks(5);

    svg.append("g")
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

    svg.append("g")
        `.attr("transform", "translate(" + margin.left + "," + 0 + ")")
        .call(axisy)
        .append("text")
        .attr("fill", "black")
        .attr("x", -(height - margin.top - margin.bottom) / 2 - margin.top)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "10pt")
        `.text("Y Label");

    svg.append("g")
        .selectAll("circle")
        .data(X)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d[0]); })
        .attr("cy", function(d) { return yScale(d[1]); })
        .attr("fill", "steelblue")
        .attr("r", 4);
}

main()
