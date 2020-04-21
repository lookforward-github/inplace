let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData;
let height = 1000, width = 1000;
let scale = getCookie('scale', 1);
let p = {x: 0, y: 0, rgba: [0, 0, 0, 255]}

scroller = new FTScroller(canvasWrapper, {
	scrollbars: false,
	bouncing: false,
	contentWidth: 1000,
	contentHeight: 1000,
	scrollBoundary: 10,
	updateOnWindowResize: true
});
zoomCanvas(scale);

if (canvas.style.zoom === undefined) {
    zoom.max = 8;
}
zoom.value = getCookie('scale', 1);

function loadData() {
    let start = Date.now();
    fetch('/get-data').then(data => {
        return data.arrayBuffer()
    }).then(data => {
        console.log("Data loaded in", Date.now() - start, "ms");
        data = new Uint8ClampedArray(data);
        console.log("Clamped array in", Date.now() - start, "ms");
        imageData = new ImageData(data, height, width);
        console.log("Data parsed in", Date.now() - start, "ms");
        redraw();
    }).catch(reason => { console.error(reason) })
}

function redraw() {
    if (imageData) {
        let start = Date.now();
        ctx.putImageData(imageData, 0, 0);
        console.log("Redrawn in", Date.now() - start, "ms");
    }
}

function zoomCanvas(value) {
    scale = parseFloat(value);
    setCookie('scale', scale);
    if (canvas.style.zoom !== undefined) {
        canvas.style.zoom = scale;
    } else {
        canvas.style.transform = `scale(${scale})`;
        canvas.width = width * scale;
        canvas.height = height * scale;
        redraw();
    }
    scroller.updateDimensions(width * scale, height * scale);
}

var rgbToHex = function (rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
       hex = "0" + hex;
  }
  return hex;
};

canvas.addEventListener('click', function(event) {
    let rect = canvas.getBoundingClientRect();
    let x = 0, y = 0;
    if (canvas.style.zoom === undefined) {
        x = Math.floor((event.clientX - rect.left) / scale);
        y = Math.floor((event.clientY - rect.top) / scale);
    } else {
        x = Math.floor((event.clientX - rect.left * scale) / scale);
        y = Math.floor((event.clientY - rect.top * scale) / scale);
    }
    p.x = x;
    p.y = y;

    console.log("Coordinates:", x, y);

    painter.style.display = 'block';
    painterInput.value = rgbaToHex(ctx.getImageData(x, y, 1, 1).data);
});

function changeColor(hex) {
    p.rgba = hexToRgba(hex);
}

function paint() {
    fetch(`/paint/${p.x}/${p.y}/${p.rgba[0]}/${p.rgba[1]}/${p.rgba[2]}`).then(() => {
        painter.style.display = 'none';
        loadData();
    });
}

window.addEventListener('scroll', function(event) {
    console.log('scroll');
    event.preventDefault();
}, false);

var hammertime = new Hammer(canvas);
hammertime.get('pinch').set({ enable: true });
hammertime.on('pinch', function(e) { console.log(e) });

loadData();

setInterval(loadData, 5000);