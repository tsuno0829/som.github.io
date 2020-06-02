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
    let x = []
    let y = []
    for (let i = 0; i < N; i++) {
        let r = Math.random() * 4 - 4
        x.push(r)
        y.push(Math.sin(r))
    }
    return [x, y]
}

function main() {
    const [N, K, sigmax, sigmin] = init()
    // console.log(N, K, sigmax, sigmin)

    const X = create_sin(N)
    let Z =  initMatrix(data, 2)
    // console.log(X)
}

main()
