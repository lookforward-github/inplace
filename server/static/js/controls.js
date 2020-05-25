function Controls($parent) {
    this.$node = document.createElement('div');
    this.$node.className = 'app_controls';
    $parent.appendChild(this.$node);

    this.ht = null;
    this.active = false;

    this.canvasLeft = 0;
    this.canvasTop = 0;
    this.scaleCenter = {x: 0, y: 0};

    this.wheel = e => {
        if (this.active) {
            if (e.deltaY > 0) {
                window.app.canvas.zoomOut(1, e.clientX, e.clientY);
            } else if (e.deltaY < 0) {
                window.app.canvas.zoomIn(1, e.clientX, e.clientY);
            }
        }
    }

    this.tap = e => {
        if (e.target.id.startsWith('app_painter')) {
            return
        }
        let p = window.app.canvas.getCoordinates(event.clientX, event.clientY);
        if (p.x >= 0 && p.x < window.app.canvas.width && p.y >= 0 && p.y < window.app.canvas.height) {
            window.app.paint(p.x, p.y);
        }
    }


    this.pinchstart = e => {
        this.scaleCenter = e.center;
    }
    this.pinchmove = e => {
        /*if (e.scale > 1) {
            window.app.canvas.zoomIn(e.scale - 1, this.scaleCenter.x, this.scaleCenter.y);
        } else {
            window.app.canvas.zoomOut(1 - e.scale, this.scaleCenter.x, this.scaleCenter.y);
        }*/
    }

    this.panstart = e => {
        this.canvasLeft = parseInt(window.app.canvas.$node.style.left || 0);
        this.canvasTop = parseInt(window.app.canvas.$node.style.top || 0);
    }
    this.panmove = e => {
        window.app.canvas.$node.style.left = (this.canvasLeft + e.deltaX) + 'px';
        window.app.canvas.$node.style.top = (this.canvasTop + e.deltaY) + 'px';
    }

    this.initHammertime = () => {
        this.ht = new Hammer($parent);
        this.ht.add(new Hammer.Pinch({ threshold: 0, pointers: 0 }));
        this.ht.get('pinch').set({ enable: true });
        this.ht.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    }

    this.init = () => {
        this.initHammertime();
        window.addEventListener('wheel', this.wheel);
        this.ht.on('tap', this.tap);
        this.ht.on('pinchstart', this.pinchstart);
        this.ht.on('pinchmove', this.pinchmove);
        this.ht.on('panstart', this.panstart);
        this.ht.on('panmove', this.panmove);
    }

    this.init();
}
