import json

from flask import Flask, render_template, send_file, request, make_response
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
    response = make_response(send_file(io.BytesIO(data.array), mimetype='application/binary', cache_timeout=-1))
    response.headers['X-Last-ID'] = len(data.history)
    return response


@app.route('/get-delta/<int:id>')
def get_delta(id):
    return json.dumps(data.history[id:])


@app.route('/paint', methods=['POST'])
def paint():
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


@app.route('/rewind')
def rewind():
    return render_template('rewind.html')


if __name__ == '__main__':
    app.run(host='0.0.0.0')
