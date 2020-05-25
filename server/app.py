from flask import Flask, render_template, send_file, request, make_response
from hashlib import md5
from data import Data
import json
import time
import uuid
import io

app = Flask(__name__)

CANVAS_HEIGHT = 500
CANVAS_WIDTH = 500
PAINT_TIMEOUT = 1
data = Data(CANVAS_WIDTH, CANVAS_HEIGHT)
release = "1.2"

activity = {}


@app.route('/')
def _app():
    return render_template('app.html')


@app.route('/rewind')
def _rewind():
    return render_template('rewind.html')


@app.route('/heatmap')
def _heatmap():
    return render_template('heatmap.html')


@app.route('/hi-res')
def _hires():
    return render_template('hires.html')


@app.route('/get-state')
def get_state():
    id = uuid.uuid4().hex
    activity[id] = time.time()

    return json.dumps({
        'lastID': len(data.history),
        'timeout': PAINT_TIMEOUT,
        'canvasHeight': CANVAS_HEIGHT,
        'canvasWidth': CANVAS_WIDTH,
        'release': release,
        'id': id
    })


@app.route('/get-data')
def get_data():
    response = make_response(send_file(io.BytesIO(data.array), mimetype='application/binary', cache_timeout=-1))
    return response


@app.route('/get-delta/<int:id>')
def get_delta(id):
    return prepare_response(data.history[id:])


@app.route('/paint', methods=['POST'])
def paint():
    if not validate_request():
        return get_delta(request.json['last_id'])

    activity[request.headers['Request-ID']] = time.time()
    update = data.change(request.json['data'], request.json['last_id'])
    return prepare_response(update)


def prepare_response(delta):
    now = time.time()
    dudes = len([k for k, v in activity.items() if now - v < 60])
    dudes = dudes if dudes > 0 else 1
    return json.dumps({'delta': delta, 'dudes': dudes})


def validate_request():
    if 'Timestamp' not in request.headers or 'Checksum' not in request.headers or 'Request-ID' not in request.headers:
        return

    if 'x' not in request.json['data'] or 'y' not in request.json['data'] or 'rgba' not in request.json['data']:
        return False

    if len(request.json['data']['rgba']) != 4:
        return False

    if request.headers['Request-ID'] not in activity:
        return False

    current_time = time.time()
    if current_time - activity[request.headers['Request-ID']] < PAINT_TIMEOUT:
        return False

    timestamp = request.headers['Timestamp']
    if current_time - int(timestamp) / 1000 > 5:
        return False

    checksum = md5(timestamp.encode('utf-8') + release.encode('utf-8') + request.data).hexdigest()
    if request.headers['Checksum'] != checksum:
        return False

    return True


@app.route('/flush')
def flush():
    data.flush()
    return 'ok'


@app.route('/dump')
def dump():
    data.dump()
    return 'ok'


if __name__ == '__main__':
    app.run(host='0.0.0.0')
