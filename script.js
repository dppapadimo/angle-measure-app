const canvas = new fabric.Canvas('canvas', {
    selection: false
});

let imgInstance = null;
let points = [];
let lines = [];

document.getElementById('upload').addEventListener('change', function (e) {
    const reader = new FileReader();
    reader.onload = function (f) {
        fabric.Image.fromURL(f.target.result, function (img) {
            canvas.clear();

            imgInstance = img;

            const scale = canvas.width / img.width;

            img.scaleToWidth(canvas.width);
            canvas.setHeight(img.height * img.scaleX);

            canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

            resetPoints();
        });
    };
    reader.readAsDataURL(e.target.files[0]);
});

// ➤ Προσθήκη σημείων με tap
canvas.on('mouse:down', function (opt) {
    if (points.length >= 3) return;

    const pointer = canvas.getPointer(opt.e);

    const circle = new fabric.Circle({
        left: pointer.x,
        top: pointer.y,
        radius: 6,
        fill: 'red',
        originX: 'center',
        originY: 'center',
        hasControls: false
    });

    circle.on('moving', updateAngle);

    canvas.add(circle);
    points.push(circle);

    updateAngle();
});

// ➤ Υπολογισμός γωνίας
function calculateAngle(A, B, C) {
    const BA = { x: A.x - B.x, y: A.y - B.y };
    const BC = { x: C.x - B.x, y: C.y - B.y };

    const dot = BA.x * BC.x + BA.y * BC.y;
    const magBA = Math.sqrt(BA.x ** 2 + BA.y ** 2);
    const magBC = Math.sqrt(BC.x ** 2 + BC.y ** 2);

    let cos = dot / (magBA * magBC);

    cos = Math.min(1, Math.max(-1, cos)); // fix precision

    const angle = Math.acos(cos);
    return angle * (180 / Math.PI);
}

// ➤ redraw
function updateAngle() {
    lines.forEach(l => canvas.remove(l));
    lines = [];

    if (points.length === 3) {
        const A = points[0];
        const B = points[1];
        const C = points[2];

        const line1 = new fabric.Line([B.left, B.top, A.left, A.top], {
            stroke: 'green',
            strokeWidth: 3
        });

        const line2 = new fabric.Line([B.left, B.top, C.left, C.top], {
            stroke: 'green',
            strokeWidth: 3
        });

        canvas.add(line1, line2);
        lines.push(line1, line2);

        const angle = calculateAngle(
            { x: A.left, y: A.top },
            { x: B.left, y: B.top },
            { x: C.left, y: C.top }
        );

        document.getElementById("angleDisplay").innerText =
            "Γωνία: " + angle.toFixed(2) + "°";
    }

    canvas.renderAll();
}

// ➤ Reset
function resetPoints() {
    points.forEach(p => canvas.remove(p));
    lines.forEach(l => canvas.remove(l));

    points = [];
    lines = [];

    document.getElementById("angleDisplay").innerText = "Γωνία: -";
    canvas.renderAll();
}

// ➤ Pinch Zoom + Pan
let zoom = 1;

canvas.on('mouse:wheel', function (opt) {
    let delta = opt.e.deltaY;
    zoom *= 0.999 ** delta;

    if (zoom > 5) zoom = 5;
    if (zoom < 0.5) zoom = 0.5;

    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);

    opt.e.preventDefault();
    opt.e.stopPropagation();
});

// ➤ Drag canvas (pan)
let isDragging = false;

canvas.on('mouse:down', function (opt) {
    if (opt.e.touches && opt.e.touches.length === 2) return;

    isDragging = true;
    canvas.selection = false;
});

canvas.on('mouse:move', function (opt) {
    if (isDragging) {
        const e = opt.e;
        canvas.relativePan({
            x: e.movementX,
            y: e.movementY
        });
    }
});

canvas.on('mouse:up', function () {
    isDragging = false;
});
