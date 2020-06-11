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

    svg_f.append("g")
        .selectAll("circle")
        .data(Z, (d) => {return d.coords})
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.coords[0]); })
        .attr("cy", function(d) { return yScale(d.coords[1]); })
        .attr("fill", d => d.color)
        .attr("r", 3);
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
        .attr("r", 3);

    svg_f.append("g")
        .selectAll("circle")
        .data(Y)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return xScale(d.coords[0]); })
        .attr("cy", function(d) { return yScale(d.coords[1]); })
        .attr("fill", "red")
        .attr("r", 2);

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

const plot_f_withPlotly = (X, Y, width, height, margin, IsWireframe) =>
    {
    var trace1 = {
        x: X.map(x => x.coords[0]),
        y: X.map(x => x.coords[1]),
        z: X.map(x => x.coords[2]),
        mode: 'markers',
        marker: {
            size: 5,
            color: X.map(d => d.color),
            // line: {
            //     color: X.map(d => d.color),
            //     width: 0.5},
            showlegend: true,
            opacity: 0.8},
        type: 'scatter3d'
    };

    var data = [trace1];

    if (IsWireframe) {
        let Y_reshape = splitArray(Y, ~~Math.sqrt(Y.length))
        for (let i = 0; i < Y_reshape.length; i++) {
            var trace = {
                type: 'scatter3d',
                mode: 'lines',
                x: Y_reshape[i].map(y => y.coords[0]),
                y: Y_reshape[i].map(y => y.coords[1]),
                z: Y_reshape[i].map(y => y.coords[2]),
                opacity: 1,
                line: {
                    width: 2,
                    color: "red",
                    reversescale: false,
                    showlegend: false
                }
            }
            data.push(trace)
        }
        // console.log(Y)
        // console.log(Y_reshape)
        Y_transpose = transpose(Y_reshape)
        for (let i = 0; i < Y_reshape.length; i++) {
            var trace = {
                type: 'scatter3d',
                mode: 'lines',
                x: Y_transpose[i].map(y => y.coords[0]),
                y: Y_transpose[i].map(y => y.coords[1]),
                z: Y_transpose[i].map(y => y.coords[2]),
                opacity: 1,
                line: {
                    width: 2,
                    color: "red",
                    reversescale: false,
                    showlegend: false
                }
            }
            data.push(trace)
        }
    } else {
        var trace = {
            type: 'scatter3d',
            mode: 'lines',
            x: Y.map(y => y.coords[0]),
            y: Y.map(y => y.coords[1]),
            z: Y.map(y => y.coords[2]),
            opacity: 1,
            line: {
                width: 2,
                color: "red",
                reversescale: false,
                showlegend: false
            }
        }
        data.push(trace)
    }

    var layout = {
        width: width,
        height: height,
        showlegend: false,
        margin: {
        l: 0,
        r: 0,
        b: 0,
        t: 0
        }};
    Plotly.newPlot("svg_observation", data, layout);
    };
