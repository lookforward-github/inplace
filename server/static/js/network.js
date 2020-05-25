function Networking() {
    this.PAINT_URL     = '/paint';
    this.GET_DATA_URL  = '/get-data';
    this.GET_STATE_URL = '/get-state';
    this.GET_DELTA_URL = '/get-delta/';

    this.id = null;
    this.release = null;

    this.getState = callback => {
        fetch(this.GET_STATE_URL)
            .then(data => data.json())
            .then(data => {
                this.id = data.id;
                this.release = data.release;
                callback(data);
            }).catch(reason => { console.error(reason) });
    }

    this.getData = callback => {
        fetch(this.GET_DATA_URL)
            .then(data => data.arrayBuffer())
            .then(data => callback(data))
            .catch(reason => { console.error(reason) });
    }

    this.getDelta = (id, callback) => {
        fetch(this.GET_DELTA_URL + id)
            .then(data => data.json())
            .then(data => callback(data))
            .catch(reason => { console.error(reason) });
    }

    this.paint = (point, id, callback) => {
        let timestamp = Date.now();
        let body = JSON.stringify({data: point, last_id: id});
        fetch(this.PAINT_URL, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
                'Request-ID': this.id,
                'Timestamp': timestamp,
                'Checksum': MD5(String(timestamp) + this.release + body)
            },
            body: body
        })
            .then(data => data.json()).then(data => callback(data))
            .catch(reason => { console.error(reason) });
    }
}

let API = new Networking();