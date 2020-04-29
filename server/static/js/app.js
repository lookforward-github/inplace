let ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
let imageData;
let height = 200, width = 200;
let scale = getCookie('scale', 4);
let minScale = 1, maxScale = 14;
let p = {x: 0, y: 0, rgba: [0, 0, 0, 255]}
let last_id = 0;

zoomCanvas(scale);

function loadData() {
    let start = Date.now();
    fetch('/get-data').then(data => {
        return data.arrayBuffer()
    }).then(data => {
        data = new Uint8ClampedArray(data);
        imageData = new ImageData(data, height, width);
        redraw();
    }).catch(reason => { console.error(reason) })
}

function loadDelta() {
    let start = Date.now();
    fetch(`/get-delta/${last_id}`).then(data => {
        return data.json()
    }).then(json => {
      for (var update of json) {
        let data = update.data;
        let pixel = new ImageData(new Uint8ClampedArray(data.rgba), 1, 1);
        ctx.putImageData(pixel, data.x, data.y);
        last_id = update.id;
      }
      imageData = ctx.getImageData(0, 0, width, height);
    })
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

    ctx.putImageData(new ImageData(new Uint8ClampedArray(p.rgba), 1, 1), p.x, p.y);

    fetch('/paint', {
        method: 'POST',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({data: p, last_id: last_id})
    }).then(data => {
      return data.json()
    }).then(json => {
      for (var update of json) {
        let data = update.data;
        let pixel = new ImageData(new Uint8ClampedArray(data.rgba), 1, 1);
        ctx.putImageData(pixel, data.x, data.y);
        last_id = update.id;
      }
      imageData = ctx.getImageData(0, 0, width, height);
    })
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

setInterval(loadDelta, 1000);