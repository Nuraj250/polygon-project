// script.js
const stage = new Konva.Stage({ container: 'container', width: window.innerWidth, height: window.innerHeight - 60 });
const layer = new Konva.Layer();
stage.add(layer);

let points = [], isClosed = false;

const scaleInput = document.getElementById('scaleInput');
const areaDisplay = document.getElementById('areaDisplay');

stage.on('mousedown', () => {
    if (isClosed) return;

    const pos = stage.getPointerPosition();
    if (points.length > 2 && isNear(points[0], pos)) return closePolygon();

    points.push(pos);
    layer.add(new Konva.Circle({ x: pos.x, y: pos.y, radius: 4, fill: '#007bff', stroke: 'white', strokeWidth: 1 }));
    redraw();
});

const redraw = () => {
    layer.find('.temp').forEach(node => node.destroy());

    points.slice(0, -1).forEach((point, idx) => {
        const nextPoint = points[idx + 1];
        drawLine(point, nextPoint);
    });

    layer.draw();
};

const drawLine = (p1, p2) => {
    layer.add(new Konva.Line({ points: [p1.x, p1.y, p2.x, p2.y], stroke: '#333', strokeWidth: 2, name: 'temp' }));
    const mid = [(p1.x + p2.x) / 2, (p1.y + p2.y) / 2];
    const dist = (distance(p1, p2) * getScale()).toFixed(2);
    layer.add(new Konva.Text({ x: mid[0], y: mid[1], text: `${dist} units`, fontSize: 14, fill: 'green', name: 'temp' }));
};

const closePolygon = () => {
    isClosed = true;
    points.push(points[0]);

    layer.add(new Konva.Line({
        points: points.flatMap(p => [p.x, p.y]),
        stroke: '#333', strokeWidth: 2,
        fill: 'rgba(0,128,0,0.2)', closed: true
    }));

    calculateArea();
    redraw();
};

const calculateArea = () => {
    const area = Math.abs(points.reduce((sum, p, i, arr) => {
        const next = arr[(i + 1) % arr.length];
        return sum + (p.x * next.y - next.x * p.y);
    }, 0) / 2);
    areaDisplay.textContent = `Area: ${(area * getScale() ** 2).toFixed(2)} units²`;
};

const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const isNear = (a, b, tol = 10) => distance(a, b) < tol;
const getScale = () => {
    const [a, b] = scaleInput.value.split(':').map(Number);
    return (a && b) ? b / a : 1;
};

const saveSketch = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([stage.toJSON()], { type: 'application/json' }));
    a.download = 'polygon-sketch.json';
    a.click();
};

const resetCanvas = () => window.location.reload();

document.getElementById('loadFile').addEventListener('change', ({ target }) => {
    const file = target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ({ target: { result } }) => {
        stage.destroy();
        document.getElementById('container').innerHTML = '';

        const newStage = Konva.Node.create(result, 'container');
        const newLayer = newStage.findOne('Layer');
        const polygon = newLayer.findOne(node => node.getClassName() === 'Line' && node.attrs.closed);

        if (polygon) {
            points = [];
            const flatPoints = polygon.points();
            for (let i = 0; i < flatPoints.length - 2; i += 2) {
                points.push({ x: flatPoints[i], y: flatPoints[i + 1] });
            }
            isClosed = true;
            calculateArea();
        }

        newStage.draw();
    };

    reader.readAsText(file);
});
