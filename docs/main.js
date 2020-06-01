function init() {
    const data = parseInt(document.getElementById("data").value)
    const node = parseInt(document.getElementById("node").value)
    const sigmax = parseFloat(document.getElementById("sigmax").value)
    const sigmin = parseFloat(document.getElementById("sigmin").value)
    return [data, node, sigmax, sigmin]
}

function main() {
    const [data, node, sigmax, sigmin] = init()
    console.log(data, node, sigmax, sigmin)
}

main()
