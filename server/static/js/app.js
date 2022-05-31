let p = {x: 0, y: 0, rgba: [0, 0, 0, 255]}

function Loader($parent, isFrame) {
    this.$node = document.createElement('div');
    this.$node.id = 'app_loader';
    $parent.appendChild(this.$node);

    this.$node.innerHTML = isFrame ? 'Click to play' : 'Loading';

    this.remove = () => {
        this.$node.remove();
        window.app.activate();
    }

    this.$node.addEventListener('click', this.remove);
}

function App($node) {
    this.isFrame = window.self != window.top;
    if (this.isFrame) {
        newTab.style.display = 'block';
    }

    this.$node = $node;
    this.loader = new Loader(this.$node, this.isFrame);
    this.controls = new Controls(this.$node);

    this.DELTA_INTERVAL = 1000;

    this.lastID = 0;
    this.timeout = 0;
    this.canvas = null;
    this.deltaInterval = null;

    this.init = () => {
        API.getState(data => {
            this.lastID = data.lastID;
            this.timeout = data.timeout;
            this.canvas = new Canvas(this.$node, data.canvasWidth, data.canvasHeight);
            this.load();
        });
    }

    this.load = () => {
        API.getData(data => {
            this.canvas.redraw(data);
            if (!this.isFrame) {
                this.loader.remove();
            }
            if (this.deltaInterval == null) {
                this.deltaInterval = setInterval(this.delta, this.DELTA_INTERVAL);
            }
        });
    }

    this.delta = () => {
        API.getDelta(this.lastID, json => {
            dudes.innerHTML = 'Online: ' + json.dudes;

            for (var update of json.delta) {
                let data = update.data;
                this.canvas.drawPixel(data.x, data.y, data.rgba);
                this.lastID = update.id;
            }
        });
    }

    this.paint = (x, y) => {
        let p = { x: x, y: y, rgba: hexToRgba(painterInput.value) }
        API.paint(p, this.lastID, res => {
            for (var update of res.delta) {
                let data = update.data;
                this.canvas.drawPixel(data.x, data.y, data.rgba);
                this.lastID = update.id;
            }
        });
    }

    this.activate = () => {
        this.controls.active = true;
    }

    this.init();
}