function calculate() {
    const ways = Number(document.getElementById("ways").value);
    if (ways ===3) {
        document.getElementById("threeWay").style.display = "block";
        document.getElementById("freqLabel").textContent = "Low crossover frequency (Hz)";
    } else {
        document.getElementById("threeWay").style.display = "none";
        document.getElementById("freqLabel").textContent = "Crossover frequency (Hz)";
    }
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

const f2 = Number(document.getElementById("freq2").value);
const midZ = Number(document.getElementById("midZ").value);
const w2 = 2 * Math.PI * f2;

let wooferParts;
let midParts = [];
let tweeterParts;
let html;

if (ways === 3) {
    wooferParts = lowPassParst(g, wooferZ, w, 1);
    midParts = highPassParts(g, midZ, w, 1).concat(lowPassParst(g, midZ, w2, g.length + 1));
    tweeterParts = highPassParts(g, tweeterZ, w2, 1);
    html = partsToHtml("Woofer (low-pass)", wooferParts);
    html += partsToHtml("Midrange (band-pass)", midParts);
    html += partsToHtml("Tweeter (high-pass", tweeterParts);
} else {
    wooferParts = lowPassParst(g, wooferZ, w, 1);
    tweeterParts = highPassParts(g, tweeterZ, w, 1);
    html = partsToHtml("Woofer (low-pass)", wooferParts);
    html += partsToHtml("Tweeter (high-pass)", tweeterParts);
}

document.getElementById("output").innerHTML = html;
drawGrid();
if (ways === 3) {
    drawCurve(f, order, type, false, "#378ADD");
    drawBandCurve(f, f2, order, type, "#1D9E75");
    drawCurve(f2, order, type, true, "#D85A30");
} else {
    drawCurve(f, order, type, false, "#378ADD");
    drawCurve(f, order, type, true, "#D85A30")
}
drawSchematic(wooferParts, midParts, tweeterParts, order === 2);

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

function lowPassParst(g, R, w, startNumber) {
    const parts = [];
    for (let i = 0; i < g.length; i++) {
        const n = startNumber + i;
        if (i % 2 === 0) {
            const L = g[i] * R / w;
            parts.push({kind: "L", series: true, label: "L" + n, value: (L * 1000).toFixed(2) + " mH"});
        } else {
            const C = g[i] / (R * w);
            parts.push({ kind: "C", series: false, label: "C" + n, value: (C * 1000000).toFixed(2) + " \u00B5F"});
        }
    }
    return parts;
}

function highPassParts(g, R, w, startNumber) {
    const parts = [];
    for (let i = 0; i < g.length; i++) {
        const n = startNumber + i;
        if (i % 2 === 0) {
            const C = 1 / (g[i] * R * w);
            parts.push({kind: "C", series: true, label: "C" + n, value: (C * 1000000).toFixed(2) + "\u00B5F" });
        } else {
            const L = R / (g[i] * w);
            parts.push({ kind: "L", series: false, label: "L" + n, value: (L * 1000).toFixed(2) + " mH"});

        }
    }
    return parts;
}

function partsToHtml(title, parts) {
    let html = "<h3>" + title + "</h3>";
    for (const part of parts) {
        let position = "parallel";
        if (part.series) {
            position = "series";
        }
        html += "<p>" + part.label + "(" + position + "): " + part.value + "</p>";
    }
    return html;
}

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

function drawBandCurve(flow, fHigh, order, type, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const points = 400;
    for (let i = 0; i <= points; i++) {
        const f = graph.fMin * Math.pow(graph.fMax / graph.fMin, i / points);
        let db = filterDb(f, flow, order, type, true) + filterDb(f, fHigh, order, type, false);
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

const sCanvas = document.getElementById("schematicCanvas");
const sCtx = sCanvas.getContext("2d");

function sLine(x1, y1, x2, y2) {
    sCtx.beginPath();
    sCtx.moveTo(x1, y1);
    sCtx.lineTo(x2, y2);
    sCtx.stroke();
}
function sDot(x, y) {
    sCtx.beginPath();
    sCtx.arc(x, y, 3, 0, 2 * Math.PI);
    sCtx.fill();
}
function sCoil(x, y, vertical) {
    for (let i= 0; i < 4; i++) {
        sCtx.beginPath();
        if (vertical) {
            sCtx.arc(x, y + 6.25 + i * 12.5, 6.25, -Math.PI / 2, Math.PI / 2, true);
        } else {
            sCtx.arc(x + 6.25 + i * 12.5, y, 6.25, Math.PI, 0);
        }
        sCtx.stroke();
    }
}
function drawSeries(part, x, y) {
    if (part.kind === "L") {
        sLine(x, y, x + 25, y);
        sCoil(x + 25, y, false);
        sLine(x + 75, y, x + 100, y);
    } else {
        sLine(x, y, x + 45, y);
        sLine(x + 45, y - 15, x + 45, y + 15);
        sLine(x + 55, y - 15, x + 55, y + 15);
        sLine(x + 55, y, x + 100, y);
    }
    sCtx.textAlign = "center";
    sCtx.fillText(part.label, x + 50, y - 36);
    sCtx.fillText(part.value, x + 50, y - 20);
}

function drawShunt(part, x, y, yGround) {
    const xm = x + 50;
    sLine(x, y, x + 100, y);
    if (part.kind === "L") {
        sLine(xm, y, xm, y + 20);
        sCoil(xm, y + 20, true);
        sLine(xm, y + 70, xm, yGround);
    } else {
        sLine(xm, y, xm, y + 40);
        sLine(xm - 15, y + 40, xm + 15, y + 40);
        sLine(xm - 15, y + 50, xm + 15, y + 50);
        sLine(xm, y + 50, xm, yGround);
    }
    sDot(xm, y);
    sDot(xm, yGround);
    sCtx.textAlign = "left";
    sCtx.fillText(part.label, xm + 20, y + 42);
    sCtx.fillText(part.value, xm + 20, y + 58);
}

function drawSpeaker(x, y, yGround, name, reversed) {
    sLine(x, y, x + 30, y);
    sLine(x + 30, y, x + 30, y + 25);
    sCtx.strokeRect(x + 20, y + 25, 20, 40);
    sCtx.beginPath();
    sCtx.moveTo(x + 40, y + 25);
    sCtx.lineTo(x + 60, y + 10);
    sCtx.lineTo(x + 60, y + 80);
    sCtx.lineTo(x + 40, y + 65);
    sCtx.stroke();
    sLine(x + 30, y + 65, x + 30, yGround);

    sCtx.textAlign = "center";
    if (reversed) {
        sCtx.fillText("\u2212", x + 12, y + 38);
        sCtx.fillText("+", x + 12, y + 62);
    } else {
        sCtx.fillText("+", x + 12, y + 38);
        sCtx.fillText("\u2212", x + 12, y + 62);
    }
    sCtx.textAlign = "left";
    sCtx.fillText(name, x + 70, y + 40);
    if (reversed) {
        sCtx.fillStyle = "#D85A30";
        sCtx.fillText("reverse polarity!", x + 70, y + 58);
        sCtx.fillStyle = "#333333";
    }
}

function drawBranch(parts, y, title, name, reversed) {
    const yGround = y + 90;
    let x = 60;

    sCtx.textAlign = "left";
    sCtx.fillText(title, 10, y - 55);

    sLine(30, y, x, y);
    sDot(30, y);
    sDot(30, yGround);
    sCtx.fillText("+", 12, y + 4);
    sCtx.fillText("\u2212", 12, yGround + 4);

    for (let i = 0; i < parts.length; i++) {
        if (parts[i].series) {
            drawSeries(parts[i], x, y);
        } else {
            drawShunt(parts[i], x, y, yGround);
        }
        x += 100;
    }
    sLine(x, y, x + 40, y);
    x += 40;
    sLine(30, yGround, x + 30, yGround);
    drawSpeaker(x, y, yGround, name, reversed);
}

function drawSchematic(wooferParts, midParts, tweeterParts, flip) {
    const maxParts = Math.max(wooferParts.length, midParts.length, tweeterParts.length);
    sCanvas.width = 60 + maxParts * 100 + 240;
    sCanvas.height = midParts.length > 0 ? 530 : 360;

    sCtx.clearRect(0, 0, sCanvas.width, sCanvas.height);
    sCtx.strokeStyle = "#333333";
    sCtx.fillStyle = "#333333";
    sCtx.lineWidth = 2;
    sCtx.font = "13px sans-serif";

    if (midParts.length > 0) {
        drawBranch(wooferParts, 80, "Woofer (low-pass)", "Woofer", false);
        drawBranch(midParts, 250, "Midrange (band-pass)", "Midrange", flip);
        drawBranch(tweeterParts, 420, "Tweeter (high-pass)", "Tweeter", false);
    } else {
        drawBranch(wooferParts, 80, "Woofer (low-pass)", "Woofer", false);
        drawBranch(tweeterParts, 250, "Tweeter (high-pass)", "Tweeter", flip);
    }
}

calculate();
document.getElementById("settings").addEventListener("input", calculate);