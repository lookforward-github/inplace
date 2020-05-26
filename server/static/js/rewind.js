let p = {x: 0, y: 0, rgba: [0, 0, 0, 255]}

function Loader($parent) {
    this.$node = document.createElement('div');
    this.$node.id = 'app_loader';
    $parent.appendChild(this.$node);

    this.$node.innerHTML = 'Загрузка';

    this.remove = () => {
        this.$node.remove();
        window.app.activate();
    }
}

function App($node) {
    this.$node = $node;
    this.loader = new Loader(this.$node);
    this.controls = new Controls(this.$node);

    this.history = null;
    this.prevMilestone = 0;
    this.lastID = 0;
    this.timeout = 0;
    this.canvas = null;

    this.init = () => {
        API.getState(data => {
            this.lastID = data.lastID;
            this.timeout = data.timeout;
            this.canvas = new Canvas(this.$node, data.canvasWidth, data.canvasHeight);
            this.load();
        });
    }

    this.load = () => {
        API.getDelta(0, data => {
            this.history = data.delta;
            historyRange.max = this.history.length;
            this.loader.remove();
        });
    }

    this.activate = () => {
        this.controls.active = true;
    }

    this.historyChange = milestone => {
        milestone = parseInt(milestone);

        if (milestone > this.prevMilestone) { // forward
            for (var update of this.history.slice(this.prevMilestone, milestone)) {
                let data = update.data;
                this.canvas.drawPixel(data.x, data.y, data.rgba);
            }
        } else if (milestone < this.prevMilestone) { // backward
            let historySlice = this.history.slice(0, this.prevMilestone - 1).reverse();
            let milestoneSlice = this.history.slice(milestone, this.prevMilestone).reverse();
            for (var update of milestoneSlice) {
                let data = historySlice.find(el => el.data.x == update.data.x && el.data.y == update.data.y);
                data = data !== undefined ? data.data : {x: update.data.x, y: update.data.y, rgba: [255, 255, 255, 255]};
                this.canvas.drawPixel(data.x, data.y, data.rgba);
                historySlice.shift()
            }
        }

        this.prevMilestone = milestone;
    }

    this.playInterval = null;
    this.play = () => {
        if (this.playInterval) {
            return;
        }
        this.playInterval = setInterval(() => {
            if (historyRange.max == historyRange.value) {
                this.pause();
            }
            this.historyChange(this.prevMilestone + 1);
            historyRange.value = this.prevMilestone;
        }, 1);
    }

    this.pause = () => {
        clearInterval(this.playInterval);
        this.playInterval = null;
    }

    this.init();
}