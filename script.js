function calculate() {
    const f = Number(document.getElementById("freq").value);
    const wooferZ = Number(document.getElementById("wooferZ").value);
    const tweeterZ = Number(document.getElementById("tweeterZ").value);
    const order = Number(document.getElementById("slope").value);
    const typeSelect = document.getElementById("filterType");
    const linkwitzOption = typeSelect.querySelector('option[value="linkwitz"]');
    if (order === 1 || order === 3) {
        linkwitzOption.disabled = true;
        typeSelect.value = "butterworth";
        } else {
            linkwitzOption.disabled = false;
    }
    let type = document.getElementById("filterType").value;
    const w = 2 * Math.PI * f;
     
    if (coefficients[type][order] === undefined) {
        type = "butterworth";
    }
    const g = coefficients[type][order];

    let html = "<h3>Woofer (low-pass)</h3>";
    for (let i = 0; i < g.length; i++) {
        if (i % 2 === 0) {
            const L = g[i] * wooferZ / w;
            html += "<p>L" + (i + 1) + " (series): " + (L * 1000).toFixed(2) + "mH</p>";
                } else {
            const C = g[i] / (wooferZ * w);
            html += "<p>C" + (i + 1) + " (parallel): " + (C * 1000000).toFixed(2) + " &micro;F</p>"; 
            }
        }
        html += "<h3>Tweeter (high-pass)</h3>";
        for (let i = 0; i < g.length; i++) {
            if (i % 2 === 0) {
                const C = 1 / (g[i] * tweeterZ * w);
                 html += "<p>C" + (i + 1) + " (series): " + (C * 1000000).toFixed(2) + "&micro;F</p>";
                } else {
                const L = tweeterZ / (g[i] * w);
                html += "<p>L" + (i + 1) + " (parallel): " + (L * 1000).toFixed(2) + "mH</p>";
         }
     }

document.getElementById("output").innerHTML = html;
drawGrid();
drawCurve(f, order, type, false, "#378ADD");
drawCurve(f, order, type, true, "#D85A30");
}

const coefficients = {
    butterworth: {
        1: [1],
        2: [1.4142, 0.7071],
        3: [1.5, 1.3333, 0.5],
        4: [1.5307, 1.5772, 1.0824, 0.3827]
    },
    linkwitz: {
        2: [2, 0.5],
        4: [1.8856, 1.5910, 0.9428, 0.3536]
    }
};

const canvas = document.getElementById("graphCanvas");
const ctx = canvas.getContext("2d");

const graph = {
    left: 50, right: 20, top: 20, bottom: 40,
    fMin: 20, fMax: 20000,
    dbMax: 10, dbMin: -40 
};

function freqToX(f) {
    const width = canvas.width - graph.left - graph.right;
    const ratio = (Math.log10(f) - Math.log10(graph.fMin)) / (Math.log10(graph.fMax) - Math.log10(graph.fMin));
    return graph.left + ratio * width;
}
function dbToY(db) {
    const height = canvas.height - graph.top - graph.bottom;
    const ratio = (graph.dbMax - db) / (graph.dbMax - graph.dbMin);
    return graph.top + ratio * height;
}
function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#dddddd";
    ctx.fillStyle = "#555555";
    ctx.font = "12px sans-serif"
    ctx.lineWidth = 1;

    const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000,];
    for (const f of freqs) {
        const x = freqToX(f);
        ctx.beginPath();
        ctx.moveTo(x, graph.top);
        ctx.lineTo(x, canvas.height - graph.bottom);
        ctx.stroke();
        const label = f >=1000 ? (f / 1000) + "k" : f;
        ctx.fillText(label, x -10, canvas.height - graph.bottom + 18);
    }
    for (let db = graph.dbMax; db >= graph.dbMin; db -= 10) {
        const y =  dbToY(db);
        ctx.beginPath();
        ctx.moveTo(graph.left, y);
        ctx.lineTo(canvas.width - graph.right, y);
        ctx.stroke();
        ctx.fillText(db + " dB", 5, y + 4);
    }
}
calculate();
document.getElementById("settings").addEventListener("input", calculate);

function filterDb(f, fc, order, type, highPass) {
    let ratio = f / fc;
    if (highPass) {
        ratio = fc / f;
    }
let gain;
if (type === "linkwitz") {
    gain = 1 / (1 + Math.pow(ratio, order));
} else {
    gain = 1 / Math.sqrt(1 + Math.pow(ratio, 2 * order));
}
return 20 * Math.log10(gain);
}
function drawCurve(fc, order, type, highPass, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const points = 400;
    for (let i = 0; i <= points; i++) {
        const f = graph.fMin * Math.pow(graph.fMax / graph.fMin, i / points);
        let db = filterDb(f, fc, order, type, highPass);
        if (db < graph.dbMin) {
            db = graph.dbMin;
        }
        const x = freqToX(f);
        const y = dbToY(db);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
}