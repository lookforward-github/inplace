function Canvas($parent, width, height) {
    this.$node = document.createElement('canvas');
    this.$node.id = 'app_canvas';
    this.$node.width = width;
    this.$node.height = height;
    $parent.appendChild(this.$node);

    this.MIN_SCALE = 1;
    this.MAX_SCALE = 14;

    this.scale = 2;
    this.width = width;
    this.height = height;
    this.ctx = this.$node.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);

    this.$node.style.left = parseInt(($parent.clientWidth - this.width) / 2) + 'px';
    this.$node.style.top = parseInt(($parent.clientHeight - this.height) / 2) + 'px';

    this.redraw = data => {
        this.imageData = new ImageData(new Uint8ClampedArray(data), this.width, this.height);
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    this.drawPixel = (x, y, rgba) => {
        let pixel = new ImageData(new Uint8ClampedArray(rgba), 1, 1);
        this.ctx.putImageData(pixel, x, y);
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    }

    this.zoom = (scale, x, y) => {
        let coordinates = this.getCoordinates(x, y);

        let left = parseInt(this.$node.style.left || 0);
        let top = parseInt(this.$node.style.top || 0);

        scale = parseFloat(scale);
        scale = Math.max(this.MIN_SCALE, scale);
        scale = Math.min(this.MAX_SCALE, scale);

        if (scale != this.scale) {
            if (scale > this.scale) {
                left -= coordinates.x;
                top -= coordinates.y;
            } else {
                left += coordinates.x;
                top += coordinates.y;
            }
            this.$node.style.left = left + 'px';
            this.$node.style.top = top + 'px';
        }

        this.scale = scale;
        this.$node.style.transform = `scale(${this.scale})`;
    }

    this.zoomIn = (scale, x, y) => this.zoom(this.scale + scale, x, y);
    this.zoomOut = (scale, x, y) => this.zoom(this.scale - scale, x, y);

    this.getCoordinates = (clientX, clientY) => {
        let rect = this.$node.getBoundingClientRect();
        let x = 0, y = 0;
        x = Math.floor((clientX - rect.left) / this.scale);
        y = Math.floor((clientY - rect.top) / this.scale);
        return {x: x, y: y}
    }
}

