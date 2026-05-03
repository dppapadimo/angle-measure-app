const canvas = new fabric.Canvas('canvas', {
  selection: false
});

let zoom = 1;
let imgScale = 1;

let angles = [];
let currentPoints = [];

let gridLines = [];
let gridVisible = false;

// ---------------- IMAGE LOAD ----------------
document.getElementById('upload').addEventListener('change', function (e) {

  const reader = new FileReader();

  reader.onload = function (f) {

    fabric.Image.fromURL(f.target.result, function (img) {

      canvas.clear();
      angles = [];
      currentPoints = [];

      const scale = window.innerWidth / img.width;
      imgScale = scale;

      canvas.setWidth(img.width * scale);
      canvas.setHeight(img.height * scale);

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'left',
        originY: 'top'
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  };

  reader.readAsDataURL(e.target.files[0]);
});

// ---------------- CLICK ----------------
canvas.on('mouse:down', function (opt) {

  const p = canvas.getPointer(opt.e);

  // convert to image coords
  const imgX = p.x / zoom;
  const imgY = p.y / zoom;

  const circle = new fabric.Circle({
    left: p.x,
    top: p.y,
    radius: 5,
    fill: 'red',
    originX: 'center',
    originY: 'center',
    selectable: true
  });

  circle.imgX = imgX;
  circle.imgY = imgY;

  circle.on('moving', updateAllAngles);

  canvas.add(circle);
  currentPoints.push(circle);

  if (currentPoints.length === 3) {
    createAngle(currentPoints);
    currentPoints = [];
  }
});

// ---------------- CREATE ANGLE ----------------
function createAngle(points) {

  const index = angles.length;
  const label = String.fromCharCode(65 + index);

  const obj = { label, points };
  angles.push(obj);

  drawAngle(obj);
}

// ---------------- DRAW ----------------
function drawAngle(a) {

  const A = a.points[0];
  const B = a.points[1];
  const C = a.points[2];

  const line1 = new fabric.Line([0,0,0,0], { stroke:'green' });
  const line2 = new fabric.Line([0,0,0,0], { stroke:'green' });

  const text = new fabric.Text('', {
    fontSize: 16,
    fill: 'blue',
    selectable: false
  });

  a.line1 = line1;
  a.line2 = line2;
  a.text = text;

  canvas.add(line1, line2, text);

  updateAngleObject(a);
}

// ---------------- UPDATE ----------------
function updateAllAngles() {

  angles.forEach(a => updateAngleObject(a));
  canvas.renderAll();
}

function updateAngleObject(a) {

  const A = a.points[0];
  const B = a.points[1];
  const C = a.points[2];

  // update image coords
  A.imgX = A.left / zoom;
  A.imgY = A.top / zoom;
  B.imgX = B.left / zoom;
  B.imgY = B.top / zoom;
  C.imgX = C.left / zoom;
  C.imgY = C.top / zoom;

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
}

// ---------------- MATH ----------------
function calculateAngle(A,B,C){

  const BA = {x:A.imgX-B.imgX, y:A.imgY-B.imgY};
  const BC = {x:C.imgX-B.imgX, y:C.imgY-B.imgY};

  const dot = BA.x*BC.x + BA.y*BC.y;
  const magBA = Math.hypot(BA.x, BA.y);
  const magBC = Math.hypot(BC.x, BC.y);

  let cos = dot/(magBA*magBC);
  cos = Math.max(-1,Math.min(1,cos));

  return Math.acos(cos)*(180/Math.PI);
}

// ---------------- ZOOM ----------------
function zoomIn(){
  zoom += 0.1;
  canvas.setZoom(zoom);
}

function zoomOut(){
  zoom -= 0.1;
  if (zoom < 0.5) zoom = 0.5;
  canvas.setZoom(zoom);
}

// ---------------- UNDO ----------------
function undo(){

  if(currentPoints.length > 0){
    const p = currentPoints.pop();
    canvas.remove(p);
    return;
  }

  if(angles.length > 0){
    const a = angles.pop();
    a.points.forEach(p=>canvas.remove(p));
    canvas.remove(a.line1, a.line2, a.text);
  }
}

// ---------------- GRID ----------------
function toggleGrid(){

  if(gridVisible){
    gridLines.forEach(l=>canvas.remove(l));
    gridLines = [];
    gridVisible = false;
    return;
  }

  const step = 50;

  for(let i=0;i<canvas.width;i+=step){
    const line = new fabric.Line([i,0,i,canvas.height],{stroke:'#ddd'});
    canvas.add(line);
    gridLines.push(line);
  }

  for(let j=0;j<canvas.height;j+=step){
    const line = new fabric.Line([0,j,canvas.width,j],{stroke:'#ddd'});
    canvas.add(line);
    gridLines.push(line);
  }

  gridVisible = true;
}

// ---------------- SAVE ----------------
function saveImage(){
  const url = canvas.toDataURL({format:'png'});
  const link = document.createElement('a');
  link.href = url;
  link.download = 'angles.png';
  link.click();
}

// ---------------- RESET ----------------
function resetAll(){
  canvas.clear();
  angles = [];
  currentPoints = [];
}
