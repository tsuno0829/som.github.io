var ukrjs = {};

function linspace(startValue, stopValue, cardinality, endpoint = false) {
  var arr = [];
  if (endpoint) var step = (stopValue - startValue) / (cardinality - 1);
  else var step = (stopValue - startValue - 1) / (cardinality - 1);

  for (var i = 0; i < cardinality; i++) {
    arr.push(startValue + step * i);
  }
  return arr;
}

function calc_sqeuclid_dist(x, y) {
  // x: (N, D), y: (K, D)
  let N = x.length;
  let K = y.length;
  let D = x[0].coords.length;
  let dist_arr = [];
  for (let n = 0; n < N; n++) {
    let tmp = [];
    for (let k = 0; k < K; k++) {
      let dist = 0;
      for (let d = 0; d < D; d++) {
        dist += Math.pow(x[n].coords[d] - y[k].coords[d], 2);
      }
      tmp.push(dist);
    }
    dist_arr.push(tmp);
  }
  return dist_arr;
}

var UnsupervisedKernelRegression = function () {
  this.iter = 0;
  this.obj_func = 0;
};

UnsupervisedKernelRegression.prototype = {
  estimate_f: (X, Y, Z) => {
    let N = Z.length;
    let Xdim = X[0].coords.length;
    let h = [];
    let H = [];

    dist = calc_sqeuclid_dist(Z, Z);

    for (let i = 0; i < N; i++) {
      let tmp = [];
      for (let j = 0; j < N; j++) {
        let t = Math.exp(-0.5 * dist[i][j]);
        tmp.push(t);
      }
      h.push(tmp);
    }

    for (let i = 0; i < N; i++) {
      let sum_h = 0;
      for (let j = 0; j < N; j++) {
        sum_h += h[i][j];
      }
      H.push(sum_h);
    }

    for (let i = 0; i < N; i++) {
      let y;
      if (Xdim < 3) y = [0, 0];
      else {
        y = [];
        for (let d = 0; d < Xdim; d++) y.push(0);
      }
      for (let n = 0; n < N; n++) {
        for (let d = 0; d < Xdim; d++) {
          y[d] += (h[n][i] * X[n].coords[d]) / H[i];
        }
      }
      Y[i].coords = y;
    }

    return [Y, h, H];
  },

  estimate_z: (X, Y, Z, h, H, eta) => {
    let N = Z.length;
    let Zdim = Z[0].coords.length;
    let Xdim = X[0].coords.length;
    let r = [];
    let delta = [];
    let dd = [];
    // let R = 0;
    // for (let i = 0; i < N; i++) {
    //   for (let d = 0; d < Xdim; d++) {
    //     R += Math.pow(X[i][d] - Y[i][d], 2);
    //   }
    // }
    // R /= 2 * N;

    for (let i = 0; i < N; i++) {
      let tmp1 = [];
      let tmp2 = [];
      for (let j = 0; j < N; j++) {
        let t1 = [];
        let t2 = [];
        for (let d = 0; d < Zdim; d++) t1.push(Z[i].coords[d] - Z[j].coords[d]);
        for (let d = 0; d < Xdim; d++) t2.push(X[j].coords[d] - Y[i].coords[d]);
        tmp1.push(t1);
        tmp2.push(t2);
      }
      delta.push(tmp1);
      dd.push(tmp2);
    }

    for (let i = 0; i < N; i++) {
      tmp = [];
      for (let j = 0; j < N; j++) {
        tmp.push(h[i][j] / H[i]);
      }
      r.push(tmp);
    }

    for (let n = 0; n < N; n++) {
      for (let i = 0; i < N; i++) {
        // calculate d_nn^T @ d_ni, d_ii^T @ d_in
        let d1_inner_product = 0;
        let d2_inner_product = 0;
        for (let d = 0; d < Xdim; d++) {
          d1_inner_product += dd[n][n][d] * dd[n][i][d];
          d2_inner_product += dd[i][i][d] * dd[i][n][d];
        }
        let Zn = [];
        for (let d = 0; d < Zdim; d++) {
          Zn.push(
            (r[n][i] * d1_inner_product * delta[n][i][d] -
              r[i][n] * d2_inner_product * delta[i][n][d]) /
              N
          );
        }
        for (let d = 0; d < Zdim; d++) {
          Z[n].coords[d] = Z[n].coords[d] - eta * Zn[d];
        }
      }
    }
    return Z;
  },
  generate_new_mapping: (X, Z, mapping_resolution) => {
    let N = Z.length;
    let Xdim = X[0].coords.length;
    let Zdim;
    if (Z[0].coords.length == 0) Zdim = 1;
    else Zdim = 2;
    let h = [];
    let H = [];
    let Y = [];
    let Znew = [];
    let newY = [];
    let Xmin = 0;
    let Xmax = 0;
    let Ymin = 0;
    let Ymax = 0;

    if (Zdim > 2) throw new Error("only supported Zdim=1,2");

    for (let i = 0; i < N; i++) {
      for (let d = 0; d < Zdim; d++) {
        let x = Z[i].coords[0];
        let y = Z[i].coords[1];
        if (x < Xmin) Xmin = x;
        if (x > Xmax) Xmax = x;
        if (y < Ymin) Ymin = y;
        if (y > Ymax) Ymax = y;
      }
    }

    let ZnewX = linspace(Xmin, Xmax, mapping_resolution, true);
    let ZnewY = linspace(Ymin, Ymax, mapping_resolution, true);

    if (Zdim == 1) {
      for (let i = 0; i < mapping_resolution; i++)
        Znew.push(new Point([ZnewX[i]]));
    } else {
      for (let i = 0; i < mapping_resolution; i++) {
        for (let j = 0; j < mapping_resolution; j++) {
          Znew.push(new Point([ZnewX[i], ZnewY[j]]));
        }
      }
    }

    dist = calc_sqeuclid_dist(Znew, Z);

    for (let i = 0; i < Math.pow(mapping_resolution, Zdim); i++) {
      let tmp = [];
      for (let j = 0; j < N; j++) {
        let t = Math.exp(-0.5 * dist[i][j]);
        tmp.push(t);
      }
      h.push(tmp);
    }

    for (let i = 0; i < Math.pow(mapping_resolution, Zdim); i++) {
      let sum_h = 0;
      for (let j = 0; j < N; j++) {
        sum_h += h[i][j];
      }
      H.push(sum_h);
    }

    for (let i = 0; i < Math.pow(mapping_resolution, Zdim); i++) {
      let y;
      if (Xdim < 3) y = [0, 0];
      else {
        y = [];
        for (let d = 0; d < Xdim; d++) y.push(0);
      }
      for (let n = 0; n < N; n++) {
        for (let d = 0; d < Xdim; d++) {
          y[d] += (h[i][n] * X[n].coords[d]) / H[i];
        }
      }
      newY.push(new Point(y));
    }

    return newY;
  },
};

ukrjs.UKR = UnsupervisedKernelRegression;
if (typeof module != "undefined") module.export = ukrjs;
