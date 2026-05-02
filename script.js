const canvas = new fabric.Canvas('canvas', {
  selection: false
});

let angles = [];
let currentPoints = [];
let imgScale = 1;

// -------------------- IMAGE UPLOAD --------------------
document.getElementById('upload').addEventListener('change', function (e) {
  const reader = new FileReader();

  reader.onload = function (f) {
    fabric.Image.fromURL(f.target.result, function (img) {

      canvas.clear();
      angles = [];
      currentPoints = [];

      img.scaleToWidth(window.innerWidth);

      canvas.setWidth(img.getScaledWidth());
      canvas.setHeight(img.getScaledHeight());

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  };

  reader.readAsDataURL(e.target.files[0]);
});

// -------------------- CLICK TO ADD POINTS --------------------
canvas.on('mouse:down', function (opt) {
  const p = canvas.getPointer(opt.e);

  const circle = new fabric.Circle({
    left: p.x,
    top: p.y,
    radius: 5,
    fill: 'red',
    originX: 'center',
    originY: 'center',
    hasControls: false,
    selectable: true
  });

  circle.on('moving', updateAllAngles);

  canvas.add(circle);
  currentPoints.push(circle);

  if (currentPoints.length === 3) {
    createAngle(currentPoints);
    currentPoints = [];
  }
});

// -------------------- CREATE ANGLE --------------------
function createAngle(points) {

  const index = angles.length;
  const label = String.fromCharCode(65 + index); // A, B, C...

  const angleObj = {
    label,
    points
  };

  angles.push(angleObj);

  drawAngle(angleObj);
}

// -------------------- DRAW ANGLE --------------------
function drawAngle(a) {

  const A = a.points[0];
  const B = a.points[1];
  const C = a.points[2];

  const line1 = new fabric.Line([B.left, B.top, A.left, A.top], {
    stroke: 'green',
    strokeWidth: 2,
    selectable: false
  });

  const line2 = new fabric.Line([B.left, B.top, C.left, C.top], {
    stroke: 'green',
    strokeWidth: 2,
    selectable: false
  });

  const angle = calculateAngle(A, B, C);

  const text = new fabric.Text(`${a.label}: ${angle.toFixed(1)}°`, {
    left: B.left + 10,
    top: B.top - 20,
    fontSize: 16,
    fill: 'blue',
    selectable: false
  });

  a.line1 = line1;
  a.line2 = line2;
  a.text = text;

  canvas.add(line1, line2, text);
}

// -------------------- UPDATE ALL ANGLES (drag) --------------------
function updateAllAngles() {

  angles.forEach(a => {

    const A = a.points[0];
    const B = a.points[1];
    const C = a.points[2];

    const angle = calculateAngle(A, B, C);

    a.line1.set({
      x1: B.left, y1: B.top,
      x2: A.left, y2: A.top
    });

    a.line2.set({
      x1: B.left, y1: B.top,
      x2: C.left, y2: C.top
    });

    a.text.set({
      left: B.left + 10,
      top: B.top - 20,
      text: `${a.label}: ${angle.toFixed(1)}°`
    });
  });

  canvas.renderAll();
}

// -------------------- ANGLE MATH --------------------
function calculateAngle(A, B, C) {

  const BA = { x: A.left - B.left, y: A.top - B.top };
  const BC = { x: C.left - B.left, y: C.top - B.top };

  const dot = BA.x * BC.x + BA.y * BC.y;
  const magBA = Math.hypot(BA.x, BA.y);
  const magBC = Math.hypot(BC.x, BC.y);

  let cos = dot / (magBA * magBC);
  cos = Math.max(-1, Math.min(1, cos));

  return Math.acos(cos) * (180 / Math.PI);
}

// -------------------- SAVE IMAGE --------------------
function saveImage() {
  const url = canvas.toDataURL({
    format: 'png',
    quality: 1
  });

  const link = document.createElement('a');
  link.href = url;
  link.download = 'angles.png';
  link.click();
}

// -------------------- RESET --------------------
function resetAll() {
  canvas.clear();
  angles = [];
  currentPoints = [];
}

// -------------------- ZOOM + PAN --------------------
let zoom = 1;

canvas.on('mouse:wheel', function (opt) {
  let delta = opt.e.deltaY;
  zoom *= 0.999 ** delta;

  zoom = Math.min(5, Math.max(0.5, zoom));

  canvas.zoomToPoint(
    { x: opt.e.offsetX, y: opt.e.offsetY },
    zoom
  );

  opt.e.preventDefault();
});

// PAN
let isDown = false;

canvas.on('mouse:down', () => isDown = true);
canvas.on('mouse:up', () => isDown = false);

canvas.on('mouse:move', function (opt) {
  if (isDown) {
    const e = opt.e;
    canvas.relativePan({ x: e.movementX, y: e.movementY });
  }
});
