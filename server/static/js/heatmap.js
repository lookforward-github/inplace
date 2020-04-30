let ctx = canvas.getContext("2d");
let ctxhm = heatmapCanvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData, heatmapImageData;
let heatmapData;
let height = 200, width = 200;
let scale = getCookie('scale', 4);
let minScale = 1, maxScale = 14;
let history;
let field = new Array(width);

for (var i = 0; i < field.length; i++) {
    field[i] = new Array(height);
    field[i].fill(0);
}

zoomCanvas(scale);

ctx.beginPath();
ctx.rect(0, 0, width, height);
ctx.fillStyle = "white";
ctx.fill();

function loadData() {
    fetch('/get-data').then(data => {
        return data.arrayBuffer()
    }).then(data => {
        data = new Uint8ClampedArray(data);
        imageData = new ImageData(data, height, width);
        redraw();
    }).catch(reason => { console.error(reason) })

    fetch('/get-delta/0').then(data => {
        return data.json()
    }).then(json => {
        let max = 0;
        history = json.delta;
        for (var update of history) {
            let data = update.data;
            field[data.x][data.y] += 1;
            max = field[data.x][data.y] > max ? field[data.x][data.y] : max;
        }
        max = Math.log(max);
        heatmap = new Array();
        for (var i = 0; i < field.length; i++) {
            for (var j = 0; j < field[i].length; j++) {
                let color = 255 * Math.log(field[j][i]) / max;
                heatmap.push(color);
                heatmap.push(0);
                heatmap.push(255 - color);
                heatmap.push(0);
            }
        }
        heatmapImageData = new ImageData(new Uint8ClampedArray(heatmap), width, height);
        redraw();
        painter.remove()
    }).catch(reason => { console.error(reason) })
}

function changeAlpha(alpha) {
    for (var i = 1; i < parseInt(heatmap.length / 4); i++) {
        heatmap[i * 4 - 1] = parseInt(alpha);
    }
    heatmapImageData = new ImageData(new Uint8ClampedArray(heatmap), width, height);
    redraw();
}

function redraw() {
    if (imageData) {
        ctx.putImageData(imageData, 0, 0);
    }
    if (heatmapImageData) {
        ctxhm.putImageData(heatmapImageData, 0, 0);
    }
}

function zoomCanvas(value) {
    value = value < minScale ? minScale : value;
    value = value > maxScale ? maxScale : value;

    scale = parseFloat(value);
    setCookie('scale', scale);

    canvas.style.transform = `scale(${scale})`;
    heatmapCanvas.style.transform = `scale(${scale})`;

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

heatmapCanvas.style.left = getCookie('canvasLeft', '0px');
heatmapCanvas.style.top = getCookie('canvasTop', '0px');

hammertime.on('panstart', function(e) {
    canvasLeft = parseInt(canvas.style.left || 0);
    canvasTop = parseInt(canvas.style.top || 0);
});
hammertime.on('panmove', function(e) {
    if (e.target.id != "alphaRange") {
        canvas.style.left = (canvasLeft + e.deltaX) + 'px';
        canvas.style.top = (canvasTop + e.deltaY) + 'px';
        heatmapCanvas.style.left = (canvasLeft + e.deltaX) + 'px';
        heatmapCanvas.style.top = (canvasTop + e.deltaY) + 'px';
    }
});
hammertime.on('panend', function(e) {
    setCookie('canvasLeft', canvas.style.left);
    setCookie('canvasTop', canvas.style.top);
});

loadData();