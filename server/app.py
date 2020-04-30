import json
import time
from hashlib import md5

from flask import Flask, render_template, send_file, request, make_response
import io

from data import Data

app = Flask(__name__)

CANVAS_HEIGHT = 200
CANVAS_WIDTH = 200
data = Data(CANVAS_WIDTH, CANVAS_HEIGHT)
release = "1.1"

activity = {}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-data')
def get_data():
    response = make_response(send_file(io.BytesIO(data.array), mimetype='application/binary', cache_timeout=-1))
    response.headers['X-Last-ID'] = len(data.history)
    response.headers['Release'] = release
    return response


@app.route('/get-delta/<int:id>')
def get_delta(id):
    now = time.time()
    dudes = len([k for k, v in activity.items() if now - v < 60])
    dudes = dudes if dudes > 0 else 1
    return json.dumps({'delta': data.history[id:], 'dudes': dudes})


@app.route('/paint', methods=['POST'])
def paint():
    if not validate_request():
        return get_delta(request.json['last_id'])

    activity[request.headers['UUID']] = time.time()
    update = data.change(request.json['data'], request.json['last_id'])
    return json.dumps({'delta': update})


def validate_request():
    if 'Timestamp' not in request.headers or 'Checksum' not in request.headers or 'UUID' not in request.headers:
        return False

    current_time = time.time()
    if request.headers['UUID'] in activity and current_time - activity[request.headers['UUID']] < 1:
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


@app.route('/rewind')
def rewind():
    return render_template('rewind.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0')
