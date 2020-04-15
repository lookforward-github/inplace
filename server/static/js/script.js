let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData;
let height = 1000, width = 1000;
let scale = getCookie('scale', 1);

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
    zoom.value = getCookie('scale', 1);
}

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
        canvas.width = 1000 * scale;
        canvas.height = 1000 * scale;
        redraw();
    }
    scroller.updateDimensions(1000 * scale, 1000 * scale);
}

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = 0, y = 0;
    if (canvas.style.zoom === undefined) {
        x = Math.floor((event.clientX - rect.left) / scale);
        y = Math.floor((event.clientY - rect.top) / scale);
    } else {
        x = Math.floor((event.clientX - rect.left * scale) / scale);
        y = Math.floor((event.clientY - rect.top * scale) / scale);
    }
    console.log("Coordinates:", x, y);
    painter.style.display = 'block';
    fetch(`/paint/${x}/${y}/0/0/0`).then(() => {
        loadData();
    })
}

canvas.addEventListener("click", function(e) {
    getMousePosition(canvas, e);
});

var hammertime = new Hammer(canvas);
hammertime.get('pinch').set({ enable: true });
hammertime.on('pinch', function(ev) {
	console.log(ev);
});

loadData();