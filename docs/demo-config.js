// Scale the given vector.
function scale(vector, a) {
    for (var i = 0; i < vector.length; i++) {
      vector[i] *= a;
    }
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

// Return a color for the given angle.
function angleColor(t) {
    var hue = ~~(300 * t / (2 * Math.PI));
    return 'hsl(' + hue + ',50%,50%)';
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

// Points in two unlinked rings.
function unlinkData(n) {
    var points = [];
    function rotate(x, y, z) {
        var u = x;
        var cos = Math.cos(.4);
        var sin = Math.sin(.4);
        var v = cos * y + sin * z;
        var w = -sin * y + cos * z;
        return [u, v, w];
    }
    for (var i = 0; i < n; i++) {
        var t = 2 * Math.PI * i / n;
        var sin = Math.sin(t);
        var cos = Math.cos(t);
        // Ring 1.
        points.push(new Point(rotate(cos, sin, 0), '#f90'));
        // Ring 2.
        points.push(new Point(rotate(3 + cos, 0, sin), '#039'));
    }
    return points;
}

// Points in linked rings.
function linkData(n) {
    var points = [];
    function rotate(x, y, z) {
        var u = x;
        var cos = Math.cos(.4);
        var sin = Math.sin(.4);
        var v = cos * y + sin * z;
        var w = -sin * y + cos * z;
        return [u, v, w];
    }
    for (var i = 0; i < n; i++) {
        var t = 2 * Math.PI * i / n;
        var sin = Math.sin(t);
        var cos = Math.cos(t);
        // Ring 1.
        points.push(new Point(rotate(cos, sin, 0), '#f90'));
        // Ring 2.
        points.push(new Point(rotate(1 + cos, 0, sin), '#039'));
    }
    return points;
}

// Points in a trefoil knot.
function trefoilData(n) {
    var points = [];
    for (var i = 0; i < n; i++) {
        var t = 2 * Math.PI * i / n;
        var x = Math.sin(t) + 2 * Math.sin(2 * t);
        var y = Math.cos(t) - 2 * Math.cos(2 * t);
        var z = -Math.sin(3 * t);
        points.push(new Point([x, y, z], angleColor(t)));
    }
    return points;
}
