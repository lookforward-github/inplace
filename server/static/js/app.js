let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData;
let height = 200, width = 200;
let scale = getCookie('scale', 4);
let minScale = 1, maxScale = 14;
let p = {x: 0, y: 0, rgba: [0, 0, 0, 255]}

zoomCanvas(scale);

/*console.log = function (...messages) {
    while (logger.childNodes.length > 100) {
        logger.removeChild(logger.firstChild);
    }
    for (message of messages) {
        logger.innerHTML += (typeof message == 'object' ? JSON.stringify(message) : message) + ' ';
    }
    logger.innerHTML += '<br>';
    logger.scrollTop = logger.scrollHeight;
}*/

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
        //console.log("Redrawn in", Date.now() - start, "ms");
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

function changeColor(hex) {
    p.rgba = hexToRgba(hex);
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

hammertime.on('tap', function(e) {
    let rect = canvas.getBoundingClientRect();
    let x = 0, y = 0;
    x = Math.floor((event.clientX - rect.left) / scale);
    y = Math.floor((event.clientY - rect.top) / scale);
    p.x = x;
    p.y = y;

    fetch(`/paint/${p.x}/${p.y}/${p.rgba[0]}/${p.rgba[1]}/${p.rgba[2]}`).then(() => {
        console.log(p)
        ctx.putImageData(new ImageData(new Uint8ClampedArray(p.rgba), 1, 1), x, y);
    });
});

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

setInterval(loadData, 5000);