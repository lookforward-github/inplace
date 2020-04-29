import json

from flask import Flask, render_template, send_file, request
import io

from data import Data

app = Flask(__name__)

CANVAS_HEIGHT = 200
CANVAS_WIDTH = 200
data = Data(CANVAS_WIDTH, CANVAS_HEIGHT)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-data')
def get_data():
    return send_file(io.BytesIO(data.array),
                     mimetype='application/binary',
                     cache_timeout=-1)


@app.route('/get-delta/<int:id>')
def get_delta(id):
    return json.dumps(data.changes[id + 1:])


@app.route('/paint', methods=['POST'])
def paint():
    print(request.json)
    update = data.change(request.json['data'], request.json['last_id'])
    return json.dumps(update)


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
