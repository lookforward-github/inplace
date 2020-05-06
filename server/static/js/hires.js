let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData, heatmapImageData;
let height = 200, width = 200;
let scale = getCookie('scale', 4);
let minScale = 1, maxScale = 14;

zoomCanvas(scale);

ctx.beginPath();
ctx.rect(0, 0, width, height);
ctx.fillStyle = "white";
ctx.fill();

function loadData() {
    fetch('/get-data').then(data => {
        return data.arrayBuffer()
    }).then(data => {
        var k = 8;
        var scaledData = new Array();
        data = new Uint8Array(data);

        for (var idx = 0; idx < parseInt(data.length / 4); idx++) {
            let r = data[idx * 4];
            let g = data[idx * 4 + 1];
            let b = data[idx * 4 + 2];
            let a = data[idx * 4 + 3];
            for (var i = 0; i < k; i++) {
                scaledData.push(r, g, b, a);
            }
            if ((idx + 1) % width === 0) {
                let row = scaledData.slice(scaledData.length - width * 4 * k);
                for (var i = 0; i < k - 1; i++) {
                    scaledData = scaledData.concat(row);
                }
                console.log(parseInt(scaledData.length / (width * k * height * k * 4) * 100) + '%');
            }
        }
        console.log(scaledData);
        scaledData = new Uint8ClampedArray(scaledData);
        imageData = new ImageData(scaledData, height * k, width * k);
        canvas.height = height * k;
        canvas.width = width * k;
        redraw();
        painter.remove();
    }).catch(reason => { console.error(reason) })
}

function redraw() {
    if (imageData) {
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
    canvas.style.left = (canvasLeft + e.deltaX) + 'px';
    canvas.style.top = (canvasTop + e.deltaY) + 'px';
});
hammertime.on('panend', function(e) {
    setCookie('canvasLeft', canvas.style.left);
    setCookie('canvasTop', canvas.style.top);
});

loadData();