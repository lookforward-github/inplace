let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData;
let height = 200, width = 200;
let scale = getCookie('scale', 4);
let minScale = 1, maxScale = 14;
let p = {x: 0, y: 0, rgba: [0, 0, 0, 255]}
let last_id = 0;
let history;

zoomCanvas(scale);
ctx.beginPath();
ctx.rect(0, 0, width, height);
ctx.fillStyle = "white";
ctx.fill();

function loadData() {
    let start = Date.now();
    fetch('/get-delta/0').then(data => {
        return data.json()
    }).then(json => {
        history = json;
        historyRange.max = json.length;
    }).catch(reason => { console.error(reason) })
}

let prevMilestone = 0;
function historyChange(milestone) {
    if (milestone > prevMilestone) { // forward
        for (var update of history.slice(prevMilestone, milestone)) {
            let data = update.data;
            let pixel = new ImageData(new Uint8ClampedArray(data.rgba), 1, 1);
            ctx.putImageData(pixel, data.x, data.y);
        }
    } else { // backward
        let historySlice = history.slice(0, prevMilestone - 1).reverse();
        for (var update of history.slice(milestone, prevMilestone).reverse()) {
            let data = historySlice.find(el => el.data.x == update.data.x && el.data.y == update.data.y);
            data = data !== undefined ? data.data : {x: update.data.x, y: update.data.y, rgba: [255, 255, 255, 255]};
            console.log(data);
            let pixel = new ImageData(new Uint8ClampedArray(data.rgba), 1, 1);
            ctx.putImageData(pixel, data.x, data.y);
        }
    }
    prevMilestone = milestone;
}

function redraw() {
    if (imageData) {
        let start = Date.now();
        ctx.putImageData(imageData, 0, 0);
    }
}

function zoomCanvas(value) {
    value = value < minScale ? minScale : value;
    value = value > maxScale ? maxScale : value;

    scale = parseFloat(value);
    setCookie('scale', scale);

    canvas.style.transform = `scale(${scale})`;

    redraw();
}

window.addEventListener('wheel', function(event) {
    if (event.deltaY > 0) {
        zoomCanvas(scale - 1);
    } else if (event.deltaY < 0) {
        zoomCanvas(scale + 1);
    }
}, false);

var hammertime = new Hammer(body);
hammertime.get('pinch').set({ enable: true });
hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

let canvasScale = scale;
hammertime.on('pinchstart', function(e) {
    canvasScale = scale;
});
hammertime.on('pinchmove', function(e) {
    zoomCanvas(canvasScale * e.scale);
});

let canvasLeft, canvasTop;

canvas.style.left = getCookie('canvasLeft', '0px');
canvas.style.top = getCookie('canvasTop', '0px');

hammertime.on('panstart', function(e) {
    canvasLeft = parseInt(canvas.style.left || 0);
    canvasTop = parseInt(canvas.style.top || 0);
});
hammertime.on('panmove', function(e) {
    if (e.target.id != "historyRange") {
        canvas.style.left = (canvasLeft + e.deltaX) + 'px';
        canvas.style.top = (canvasTop + e.deltaY) + 'px';
    }
});
hammertime.on('panend', function(e) {
    setCookie('canvasLeft', canvas.style.left);
    setCookie('canvasTop', canvas.style.top);
});

loadData();