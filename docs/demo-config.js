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

// Add two vectors.
function add(a, b) {
  var n = a.length;
  var c = [];
  for (var i = 0; i < n; i++) {
    c[i] = a[i] + b[i];
  }
  return c;
}

// A point with color info.
var Point = function (coords, color) {
  this.coords = coords;
  this.color = color || "#039";
};

// Convenience function to wrap 2d arrays as Points, using a default
// color scheme.
function makePoints(originals) {
  var points = originals.map(function (p) {
    return new Point(p);
  });
  addSpatialColors(points);
  return points;
}

// Adds colors to points depending on 2D location of original.
function addSpatialColors(points) {
  var xExtent = d3.extent(points, function (p) {
    return p.coords[0];
  });
  var yExtent = d3.extent(points, function (p) {
    return p.coords[1];
  });
  var xScale = d3.scaleLinear().domain(xExtent).range([0, 255]);
  var yScale = d3.scaleLinear().domain(yExtent).range([0, 255]);
  points.forEach(function (p) {
    var c1 = ~~xScale(p.coords[0]);
    var c2 = ~~yScale(p.coords[1]);
    p.color = "rgb(20," + c1 + "," + c2 + ")";
  });
}

// Return a color for the given angle.
function angleColor(t) {
  var hue = ~~((300 * t) / (2 * Math.PI));
  return "hsl(" + hue + ",50%,50%)";
}

function sequentialColorRainbow(points, t) {
  var colorScale = d3
    .scaleSequential(d3.interpolateRainbow)
    .domain([d3.min(t), d3.max(t)]);

  return points.map((d, i) => {
    return new Point(d, colorScale(t[i]));
  });
}

function multiplyScalar(vector, x) {
  return vector.map((val) => val * x);
}

function addNoise(vector, x) {
  return vector.map((val) => {
    const noise = Math.random() * x - x / 2;
    return val + noise;
  });
}

function star(n, dim, nArms) {
  const points = [];
  const pointsPerArm = Math.floor(n / nArms);
  for (let i = 0; i < nArms; i++) {
    const color = angleColor((Math.PI * 2 * i) / nArms);
    const armVector = normalVector(dim);
    for (let i = 0; i < pointsPerArm; i++) {
      const percent = i / pointsPerArm;
      const noise = 0.01;
      const p = addNoise(multiplyScalar(armVector, percent), noise);
      points.push(new Point(p, color));
    }
  }
  return points;
}

function interpolate(a, b, percent) {
  return a.map((val, i) => {
    const d = b[i] - val;
    return d * percent + val;
  });
}

function linkedClusters(nClusters, dim, perCluster, perLink) {
  const points = [];
  const centroids = [];
  for (let i = 0; i < nClusters; i++) {
    const color = angleColor((Math.PI * 2 * i) / nClusters);
    const centroid = normalVector(dim);
    centroids.push(centroid);

    for (let i = 0; i < perCluster; i++) {
      const p = addNoise(centroid, 0.2);
      points.push(new Point(p, color));
    }

    if (i > 0) {
      const lastCentroid = centroids[i - 1];
      for (let i = 0; i < perLink; i++) {
        const percent = i / perLink;
        const p = interpolate(centroid, lastCentroid, percent);
        points.push(new Point(addNoise(p, 0.01), "darkgray"));
      }
    }
  }
  return points;
}

// Data in a 2D circle, regularly spaced.
function circleData(numPoints) {
  var points = [];
  for (var i = 0; i < numPoints; i++) {
    var t = (2 * Math.PI * i) / numPoints;
    points.push(new Point([Math.cos(t), Math.sin(t)], angleColor(t)));
  }
  return points;
}

// Random points on a 2D circle.
function randomCircleData(numPoints) {
  var points = [];
  for (var i = 0; i < numPoints; i++) {
    var t = 2 * Math.PI * Math.random();
    points.push(new Point([Math.cos(t), Math.sin(t)], angleColor(t)));
  }
  return points;
}

// Clusters arranged in a circle.
function randomCircleClusterData(numPoints) {
  var points = [];
  for (var i = 0; i < numPoints; i++) {
    var t = (2 * Math.PI * i) / numPoints; //Math.random();
    var color = angleColor(t);
    for (var j = 0; j < 20; j++) {
      var x = Math.cos(t) + 0.01 * normal();
      var y = Math.sin(t) + 0.01 * normal();
      points.push(new Point([x, y], color));
    }
  }
  return points;
}

// Data in shape of 2D grid.
function gridData(size) {
  let points = [];
  for (var x = 0; x < size; x++) {
    for (var y = 0; y < size; y++) {
      points.push([x - ~~size / 2, y - ~~size / 2]);
    }
  }
  return makePoints(points);
}

// Gaussian cloud, symmetric, of given dimension.
function gaussianData(n, dim) {
  var points = [];
  for (var i = 0; i < n; i++) {
    var p = normalVector(dim);
    points.push(new Point(p));
  }
  return points;
}

// Elongated Gaussian ellipsoid.
function longGaussianData(n, dim) {
  var points = [];
  for (var i = 0; i < n; i++) {
    var p = normalVector(dim);
    for (var j = 0; j < dim; j++) {
      p[j] /= 1 + j;
    }
    points.push(new Point(p));
  }
  return points;
}

// Two clusters of the same size.
function twoClustersData(n, dim) {
  dim = dim || 50;
  var points = [];
  for (var i = 0; i < n; i++) {
    points.push(new Point(normalVector(dim), "#039"));
    var v = normalVector(dim);
    v[0] += 10;
    points.push(new Point(v, "#f90"));
  }
  return points;
}

// Two differently sized clusters, of arbitrary dimensions.
function twoDifferentClustersData(n, dim, scale) {
  dim = dim || 50;
  scale = scale || 10;
  var points = [];
  for (var i = 0; i < n; i++) {
    points.push(new Point(normalVector(dim), "#039"));
    var v = normalVector(dim);
    for (var j = 0; j < dim; j++) {
      v[j] /= scale;
    }
    v[0] += 20;
    points.push(new Point(v, "#f90"));
  }
  return points;
}

// Three clusters, at different distances from each other, in any dimension.
function threeClustersData(n, dim) {
  dim = dim || 50;
  var points = [];
  for (var i = 0; i < n; i++) {
    var p1 = normalVector(dim);
    points.push(new Point(p1, "#039"));
    var p2 = normalVector(dim);
    p2[0] += 10;
    points.push(new Point(p2, "#f90"));
    var p3 = normalVector(dim);
    p3[0] += 50;
    points.push(new Point(p3, "#6a3"));
  }
  return points;
}

// One tiny cluster inside of a big cluster.
function subsetClustersData(n, dim) {
  dim = dim || 2;
  var points = [];
  for (var i = 0; i < n; i++) {
    var p1 = normalVector(dim);
    points.push(new Point(p1, "#039"));
    var p2 = normalVector(dim);
    scale(p2, 50);
    points.push(new Point(p2, "#f90"));
  }
  return points;
}

// Data in a rough simplex.
function simplexData(n, noise) {
  noise = noise || 0.5;
  var points = [];
  for (var i = 0; i < n; i++) {
    var p = [];
    for (var j = 0; j < n; j++) {
      p[j] = i == j ? 1 + noise * normal() : 0;
    }
    points.push(new Point(p));
  }
  return points;
}

// Uniform points from a cube.
function cubeData(n, dim) {
  var points = [];
  for (var i = 0; i < n; i++) {
    var p = [];
    for (var j = 0; j < dim; j++) {
      p[j] = Math.random();
    }
    points.push(new Point(p));
  }
  return points;
}

// Points in two unlinked rings.
function unlinkData(n) {
  var points = [];
  function rotate(x, y, z) {
    var u = x;
    var cos = Math.cos(0.4);
    var sin = Math.sin(0.4);
    var v = cos * y + sin * z;
    var w = -sin * y + cos * z;
    return [u, v, w];
  }
  for (var i = 0; i < n; i++) {
    var t = (2 * Math.PI * i) / n;
    var sin = Math.sin(t);
    var cos = Math.cos(t);
    // Ring 1.
    points.push(new Point(rotate(cos, sin, 0), "#f90"));
    // Ring 2.
    points.push(new Point(rotate(3 + cos, 0, sin), "#039"));
  }
  return points;
}

// Points in linked rings.
function linkData(n) {
  var points = [];
  function rotate(x, y, z) {
    var u = x;
    var cos = Math.cos(0.4);
    var sin = Math.sin(0.4);
    var v = cos * y + sin * z;
    var w = -sin * y + cos * z;
    return [u, v, w];
  }
  for (var i = 0; i < n; i++) {
    var t = (2 * Math.PI * i) / n;
    var sin = Math.sin(t);
    var cos = Math.cos(t);
    // Ring 1.
    points.push(new Point(rotate(cos, sin, 0), "#f90"));
    // Ring 2.
    points.push(new Point(rotate(1 + cos, 0, sin), "#039"));
  }
  return points;
}

// Points in a trefoil knot.
function trefoilData(n) {
  var points = [];
  for (var i = 0; i < n; i++) {
    var t = (2 * Math.PI * i) / n;
    var x = Math.sin(t) + 2 * Math.sin(2 * t);
    var y = Math.cos(t) - 2 * Math.cos(2 * t);
    var z = -Math.sin(3 * t);
    points.push(new Point([x, y, z], angleColor(t)));
  }
  return points;
}

// Two long, linear clusters in 2D.
function longClusterData(n) {
  var points = [];
  var s = 0.03 * n;
  for (var i = 0; i < n; i++) {
    var x1 = i + s * normal();
    var y1 = i + s * normal();
    points.push(new Point([x1, y1], "#039"));
    var x2 = i + s * normal() + n / 5;
    var y2 = i + s * normal() - n / 5;
    points.push(new Point([x2, y2], "#f90"));
  }
  return points;
}

// Mutually orthogonal steps.
function orthoCurve(n) {
  var points = [];
  for (var i = 0; i < n; i++) {
    var coords = [];
    for (var j = 0; j < n; j++) {
      coords[j] = j < i ? 1 : 0;
    }
    var t = (1.5 * Math.PI * i) / n;
    points.push(new Point(coords, angleColor(t)));
  }
  return points;
}

// Random walk
function randomWalk(n, dim) {
  var points = [];
  var current = [];
  for (var i = 0; i < dim; i++) {
    current[i] = 0;
  }
  for (var i = 0; i < n; i++) {
    var step = normalVector(dim);
    var next = current.slice();
    for (var j = 0; j < dim; j++) {
      next[j] = current[j] + step[j];
    }
    var t = (1.5 * Math.PI * i) / n;
    points.push(new Point(next, angleColor(t)));
    current = next;
  }
  return points;
}

// Random jump: a random walk with
// additional noise added at each step.
function randomJump(n, dim) {
  var points = [];
  var current = [];
  for (var i = 0; i < dim; i++) {
    current[i] = 0;
  }
  for (var i = 0; i < n; i++) {
    var step = normalVector(dim);
    var next = add(step, current.slice());
    var r = normalVector(dim);
    scale(r, Math.sqrt(dim));
    var t = (1.5 * Math.PI * i) / n;
    var coords = add(r, next);
    points.push(new Point(coords, angleColor(t)));
    current = next;
  }
  return points;
}

function sinData(N) {
  let points = [];
  for (let i = 0; i < N; i++) {
    let r = Math.random() * 6 - 3;
    points.push([r, Math.sin(r) + Math.random() * 0.2]);
  }
  return makePoints(points);
}

function kuraData(N) {
  let points = [];
  for (let i = 0; i < N; i++) {
    let z1 = Math.random() * 2 - 1;
    let z2 = Math.random() * 2 - 1;
    let z3 = z1 * z1 - z2 * z2;
    points.push([z1, z2, z3]);
  }
  return makePoints(points);
}

function gaussianMixtureCircle(N, num_cluster = 8, scale = 1, std = 0.3) {
  // ランダムな整数を生成する
  var min = 1;
  var max = num_cluster;
  var rand_indices = [];
  for (let i = 0; i < N; i++)
    rand_indices.push(Math.floor(Math.random() * (max + 1 - min)) + min);
  const base_angle = (Math.PI * 2) / num_cluster;
  var angle = [];
  var mean = [];
  for (let i = 0; i < N; i++) {
    angle.push(rand_indices[i] * base_angle - Math.PI / 2);
    mean.push([Math.cos(angle[i]) * scale, Math.sin(angle[i]) * scale]);
  }
  var points = [];
  for (let i = 0; i < N; i++) {
    var point = [];
    var color = angleColor(rand_indices[i]);
    for (let d = 0; d < 2; d++) {
      point.push(d3.randomNormal(mean[i][d], std * std)());
    }
    points.push(new Point(point, color));
  }
  return points;
}

// from sklearn
function s_curve(n_samples) {
  var points = [];
  var t_hist = [];
  for (let i = 0; i < n_samples; i++) {
    var t = 3 * Math.PI * (Math.random() - 0.5);
    var x = Math.sin(t);
    var y = 2 * Math.random();
    var z = Math.sign(t) * (Math.cos(t) - 1);
    points.push([x, y, z]);
    t_hist.push(t);
  }
  return sequentialColorRainbow(points, t_hist);
}

// from sklearn
function swiss_roll(n_samples, noise = 0.0) {
  var colors = [];
  var points = [];
  for (let i = 0; i < n_samples; i++) {
    t = 1.5 * Math.PI * (1 + 2 * Math.random());
    x = t * Math.cos(t);
    y = 21 * Math.random();
    z = t * Math.sin(t);
    points.push([x + noise, y + noise, z + noise]);
    colors.push(t);
  }

  return sequentialColorRainbow(points, colors);
}

// from sklearn
function moon(n_samples) {
  var points = [];
  n_samples_out = Math.floor(n_samples / 2);
  n_samples_in = n_samples - n_samples_out;
  outer_circ_x = linspace(0, Math.PI, n_samples_out, (endpoint = true)).map(
    (d) => {
      return Math.cos(d);
    }
  );
  outer_circ_y = linspace(0, Math.PI, n_samples_out, (endpoint = true)).map(
    (d) => {
      return Math.sin(d);
    }
  );
  inner_circ_x = linspace(0, Math.PI, n_samples_in, (endpoint = true)).map(
    (d) => {
      return 1 - Math.cos(d);
    }
  );
  inner_circ_y = linspace(0, Math.PI, n_samples_in, (endpoint = true)).map(
    (d) => {
      return 1 - Math.sin(d) - 0.5;
    }
  );
  for (let i = 0; i < n_samples_out; i++) {
    points.push(new Point([outer_circ_x[i], outer_circ_y[i]], "#CCCC00"));
  }
  for (let i = 0; i < n_samples_in; i++) {
    points.push(new Point([inner_circ_x[i], inner_circ_y[i]], "#333300"));
  }
  return points;
}

// from sklearn
function circles(n_samples) {
  var points = [];
  var factor = 0.5;
  n_samples_out = Math.floor(n_samples / 2);
  n_samples_in = n_samples - n_samples_out;

  linspace_out = linspace(0, 2 * Math.PI, n_samples_out, (endpoint = true));
  linspace_in = linspace(0, 2 * Math.PI, n_samples_in, (endpoint = true));
  outer_circ_x = linspace_out.map((d) => {
    return Math.cos(d);
  });
  outer_circ_y = linspace_out.map((d) => {
    return Math.sin(d);
  });
  inner_circ_x = linspace_in.map((d) => {
    return Math.cos(d) * factor;
  });
  inner_circ_y = linspace_in.map((d) => {
    return Math.sin(d) * factor;
  });
  for (let i = 0; i < n_samples_out; i++) {
    points.push(new Point([outer_circ_x[i], outer_circ_y[i]], "#039"));
  }
  for (let i = 0; i < n_samples_in; i++) {
    points.push(new Point([inner_circ_x[i], inner_circ_y[i]], "#f90"));
  }
  return points;
}

// from sklearn
function severed_sphere(n_samples) {
  var p = [];
  var t = [];
  var indices = [];
  for (let i = 0; i < n_samples; i++) {
    var x = Math.random() * Math.PI;
    p.push(Math.random() * (2 * Math.PI - 0.55));
    t.push(x);
    indices.push((x < Math.PI - Math.PI / 8) & (x > Math.PI / 8));
  }
  var colors = [];
  var points = [];
  for (let i = 0; i < indices.length; i++) {
    var x, y, z;
    if (indices[i]) {
      colors.push(p[i]);
      x = Math.sin(t[i]) * Math.cos(p[i]);
      y = Math.sin(t[i]) * Math.sin(p[i]);
      z = Math.cos(t[i]);
      points.push([x, y, z]);
    }
  }
  return sequentialColorRainbow(points, colors);
}

var demos = [
  {
    name: "Star",
    description: "Points arranged in a radial star pattern",
    options: [
      {
        name: "Number of points",
        min: 10,
        max: 300,
        start: 100,
      },
      {
        name: "Dimensions",
        min: 3,
        max: 50,
        start: 10,
      },
      {
        name: "Number of arms",
        min: 3,
        max: 20,
        start: 5,
      },
    ],
    generator: star,
  },
  {
    name: "Linked Clusters",
    description: "Clusters linked with a chain of points",
    options: [
      {
        name: "Number of clusters",
        min: 3,
        max: 20,
        start: 6,
      },
      {
        name: "Dimensions",
        min: 3,
        max: 100,
        start: 10,
      },
      {
        name: "Points per cluster",
        min: 10,
        max: 100,
        start: 30,
      },
      {
        name: "Points per link",
        min: 5,
        max: 100,
        start: 15,
      },
    ],
    generator: linkedClusters,
  },
  {
    name: "Grid",
    description:
      "A square grid with equal spacing between points. " +
      "Try convergence at different sizes.",
    options: [
      {
        name: "Points Per Side",
        min: 2,
        max: 20,
        start: 10,
      },
    ],
    generator: gridData,
  },
  {
    name: "Two Clusters",
    description: "Two clusters with equal numbers of points.",
    options: [
      {
        name: "Points Per Cluster",
        min: 1,
        max: 100,
        start: 50,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 100,
        start: 2,
      },
    ],
    generator: twoClustersData,
  },
  {
    name: "Three Clusters",
    description:
      "Three clusters with equal numbers of points, but at " +
      "different distances from each other. Cluster distances are " +
      "only apparent at certain perplexities",
    options: [
      {
        name: "Points Per Cluster",
        min: 1,
        max: 100,
        start: 50,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 100,
        start: 2,
      },
    ],
    generator: threeClustersData,
  },
  {
    name: "Two Different-Sized Clusters",
    description:
      "Two clusters with equal numbers of points, but different " +
      "variances within the clusters. Cluster separation depends on perplexity.",
    options: [
      {
        name: "Points Per Cluster",
        min: 1,
        max: 100,
        start: 50,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 100,
        start: 2,
      },
      {
        name: "Scale",
        min: 1,
        max: 10,
        start: 5,
      },
    ],
    generator: twoDifferentClustersData,
  },
  {
    name: "Two Long Linear Clusters",
    description:
      "Two sets of points, arranged in parallel lines that " +
      "are close to each other. Note curvature of lines.",
    options: [
      {
        name: "Points Per Cluster",
        min: 1,
        max: 100,
        start: 50,
      },
    ],
    generator: longClusterData,
  },
  {
    name: "Cluster In Cluster",
    description:
      "A dense, tight cluster inside of a wide, sparse cluster. " +
      "Perplexity makes a big difference here.",
    options: [
      {
        name: "Points Per Cluster",
        min: 1,
        max: 100,
        start: 50,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 100,
        start: 2,
      },
    ],
    generator: subsetClustersData,
  },
  {
    name: "Circle (Evenly Spaced)",
    description:
      "Points evenly distributed in a circle. " +
      "Hue corresponds to angle in the circle.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 100,
        start: 50,
      },
    ],
    generator: circleData,
  },
  {
    name: "Circle (Randomly Spaced)",
    description:
      "Points randomly distributed in a circle. " +
      "Hue corresponds to angle in the circle.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 100,
        start: 50,
      },
    ],
    generator: randomCircleData,
  },
  {
    name: "andomCircleClusterData",
    description: "andomCircleClusterData",
    options: [
      {
        name: "Number of Points",
        min: 2,
        max: 20,
        start: 10,
      },
    ],
    generator: randomCircleClusterData,
  },
  {
    name: "gaussian mixture circle",
    description: "gaussian mixture circle",
    options: [
      {
        name: "Number of Points",
        min: 20,
        max: 500,
        start: 100,
      },
    ],
    generator: gaussianMixtureCircle,
  },
  {
    name: "Gaussian Cloud",
    description:
      "Points in a unit Gaussian distribution. " +
      "Data is entirely random, so any visible subclusters are " +
      "not statistically significant",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 500,
        start: 50,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 100,
        start: 2,
      },
    ],
    generator: gaussianData,
  },
  {
    name: "Ellipsoidal Gaussian Cloud",
    description:
      "Points in an ellipsoidal Gaussian distribution. " +
      " Dimension n has variance 1/n. Elongation is visible in plot.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 500,
        start: 50,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 100,
        start: 2,
      },
    ],
    generator: longGaussianData,
  },
  {
    name: "Trefoil Knot",
    description:
      "Points arranged in 3D, following a trefoil knot. " +
      "Different runs may give different results.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 200,
        start: 50,
      },
    ],
    generator: trefoilData,
  },
  {
    name: "Linked Rings",
    description:
      "Points arranged in 3D, on two linked circles. " +
      "Different runs may give different results.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 200,
        start: 50,
      },
    ],
    generator: linkData,
  },
  {
    name: "Unlinked Rings",
    description: "Points arranged in 3D, on two unlinked circles",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 200,
        start: 50,
      },
    ],
    generator: unlinkData,
  },
  {
    name: "Orthogonal Steps",
    description:
      "Points related by mutually orthogonal steps. " +
      "Very similar to a random walk.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 500,
        start: 50,
      },
    ],
    generator: orthoCurve,
  },
  {
    name: "Random Walk",
    description: "Random (Gaussian) walk. " + "Smoother than you might think.",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 1000,
        start: 100,
      },
      {
        name: "Dimension",
        min: 2,
        max: 1000,
        start: 100,
      },
    ],
    generator: randomWalk,
  },
  {
    name: "Random Jump",
    description: "Random (Gaussian) Jump",
    options: [
      {
        name: "Number Of Points",
        min: 1,
        max: 1000,
        start: 100,
      },
      {
        name: "Dimension",
        min: 2,
        max: 1000,
        start: 100,
      },
    ],
    generator: randomJump,
  },
  {
    name: "Equally Spaced",
    description:
      "A set of points, where distances between all pairs of " +
      "points are the same in the original space.",
    options: [
      {
        name: "Number Of Points",
        min: 2,
        max: 100,
        start: 50,
      },
    ],
    generator: simplexData,
  },
  {
    name: "Uniform Distribution",
    description: "Points uniformly distributed in a unit cube.",
    options: [
      {
        name: "Number Of Points",
        min: 2,
        max: 1000,
        start: 200,
      },
      {
        name: "Dimensions",
        min: 2,
        max: 10,
        start: 2,
      },
    ],
    generator: cubeData,
  },
  {
    name: "sine curve",
    description: "sine curve",
    options: [
      {
        name: "Number of Points",
        min: 2,
        max: 200,
        start: 100,
      },
    ],
    generator: sinData,
  },
  {
    name: "kura data",
    description: "kura data",
    options: [
      {
        name: "Number of Points",
        min: 10,
        max: 1000,
        start: 400,
      },
    ],
    generator: kuraData,
  },
  {
    name: "S curve",
    description: "S curve",
    options: [
      {
        name: "Number of Points",
        min: 100,
        max: 500,
        start: 300,
      },
    ],
    generator: s_curve,
  },
  {
    name: "swiss_roll",
    description: "swiss_roll",
    options: [
      {
        name: "Number of Points",
        min: 100,
        max: 500,
        start: 300,
      },
    ],
    generator: swiss_roll,
  },
  {
    name: "moon",
    description: "moon",
    options: [
      {
        name: "Number of Points",
        min: 50,
        max: 200,
        start: 100,
      },
    ],
    generator: moon,
  },
  {
    name: "circles",
    description: "circles",
    options: [
      {
        name: "Number of Points",
        min: 50,
        max: 200,
        start: 100,
      },
    ],
    generator: circles,
  },
  {
    name: "severed sphere",
    description: "severed sphere",
    options: [
      {
        name: "Number of Points",
        min: 200,
        max: 1000,
        start: 500,
      },
    ],
    generator: severed_sphere,
  },
];

if (typeof module != "undefined")
  module.exports = {
    demos: demos,
    Point: Point,
  };
