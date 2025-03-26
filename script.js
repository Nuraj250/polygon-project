// script.js
let stage = new Konva.Stage({
    container: 'container',
    width: window.innerWidth,
    height: window.innerHeight - 60,
});
let layer = new Konva.Layer();
stage.add(layer);

let points = [];
let pointCircles = [];
let polygonShape = null;
let dimensionTexts = [];
let isClosed = false;

const scaleInput = document.getElementById('scaleInput');
const areaDisplay = document.getElementById('areaDisplay');

stage.on('mousedown', () => {
    if (isClosed) return;
    const pos = stage.getPointerPosition();

    if (points.length > 2 && isNear(points[0], pos, 10)) {
        closePolygon();
        return;
    }

    points.push(pos);
    drawPoint(pos);
    updateLines();
});

function drawPoint(pos) {
    const circle = new Konva.Circle({
        x: pos.x,
        y: pos.y,
        radius: 4,
        fill: '#007bff',
        stroke: 'white',
        strokeWidth: 1
    });
    pointCircles.push(circle);
    layer.add(circle);
}

function updateLines() {
    layer.find(line => line.getClassName() === 'Line' && !line.attrs.closed)
        .forEach(line => line.destroy());

    dimensionTexts.forEach(t => t.destroy());
    dimensionTexts = [];

    for (let i = 0; i < points.length - 1; i++) {
        drawLine(points[i], points[i + 1]);
    }
    layer.draw();
}

function drawLine(p1, p2) {
    const line = new Konva.Line({
        points: [p1.x, p1.y, p2.x, p2.y],
        stroke: '#333',
        strokeWidth: 2
    });
    layer.add(line);

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const dist = distance(p1, p2) * getScaleFactor();

    const label = new Konva.Text({
        x: midX,
        y: midY,
        text: `${dist.toFixed(2)} units`,
        fontSize: 14,
        fill: 'green'
    });
    dimensionTexts.push(label);
    layer.add(label);
}

function closePolygon() {
    isClosed = true;
    points.push(points[0]);
    updateLines();

    polygonShape = new Konva.Line({
        points: points.flatMap(p => [p.x, p.y]),
        stroke: '#333',
        strokeWidth: 2,
        fill: 'rgba(0, 128, 0, 0.2)',
        closed: true
    });
    layer.add(polygonShape);
    showArea();
    layer.draw();
}

function showArea() {
    const area = Math.abs(
        points.slice(0, -1).reduce((acc, curr, i, arr) => {
            const next = arr[(i + 1) % arr.length];
            return acc + (curr.x * next.y - next.x * curr.y);
        }, 0) / 2
    );
    const scale = getScaleFactor();
    areaDisplay.textContent = `Area: ${(area * scale * scale).toFixed(2)} units²`;
}

function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function isNear(p1, p2, tolerance = 10) {
    return distance(p1, p2) < tolerance;
}

function getScaleFactor() {
    const val = scaleInput.value.trim();
    if (!val.includes(':')) return 1;
    const [a, b] = val.split(':').map(Number);
    return (a && b) ? (b / a) : 1;
}

function saveSketch() {
    const json = stage.toJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'polygon-sketch.json';
    a.click();
    URL.revokeObjectURL(url);
}

function resetCanvas() {
    window.location.reload();
}

// Load sketch functionality
document.getElementById('loadFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
        const json = evt.target.result;
        stage.destroy();
        document.getElementById('container').innerHTML = '';
        stage = Konva.Node.create(json, 'container');
        layer = stage.findOne('Layer');
        stage.draw();

        const loadedPolygon = layer.findOne(node =>
            node.getClassName() === 'Line' && node.attrs.closed
        );

        if (loadedPolygon) {
            const flatPoints = loadedPolygon.points();
            points = [];

            for (let i = 0; i < flatPoints.length - 2; i += 2) {
                points.push({ x: flatPoints[i], y: flatPoints[i + 1] });
            }

            polygonShape = loadedPolygon;
            isClosed = true;

            // Ensure recalculation and display area after loading
            showArea();
        } else {
            areaDisplay.textContent = 'Area: 0.00 units²';
        }
    };
    reader.readAsText(file);
});

