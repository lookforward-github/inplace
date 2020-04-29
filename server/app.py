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
release = "1.0"


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
    return json.dumps(data.history[id:])


@app.route('/paint', methods=['POST'])
def paint():
    if not validate_request():
        return get_delta(request.json['last_id'])

    update = data.change(request.json['data'], request.json['last_id'])
    return json.dumps(update)


def validate_request():
    timestamp = request.headers['Timestamp']
    if time.time() - int(timestamp) / 1000 > 5:
        return False
    checksum = md5(release.encode('utf-8') + timestamp.encode('utf-8') + request.data).hexdigest()
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
