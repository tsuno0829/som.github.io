var somjs = {}

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

var SOM = function() {
    this.iter = 0;
};

SOM.prototype = {
    estimate_f: (X, Y, z, zeta, sigma) => {
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
            let y
            if (D < 3) y = [0, 0]
            else y = [0, 0, 0]
            for (let n = 0; n < N; n++) {
                for (let d = 0; d < D; d++) {
                    y[d] += h[n][k] * X[n].coords[d] / H[k]
                }
            }
            Y[k].coords = y
        }
        return Y
    },

    estimate_z: (X, Y, Z, Zeta) => {
        let N = Z.length
        let dist = calc_sqeuclid_dist(X, Y)
        for (let n = 0; n < N; n++) {
            min_zeta_idx = argMin(dist[n])
            Z[n].coords = Zeta[min_zeta_idx].coords
        }
        return Z
    }
}

somjs.SOM = SOM;
if (typeof module != "undefined") module.export = somjs;
