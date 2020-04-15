import base64
import io
import time

from flask import Flask, render_template, send_file
import random
import json
app = Flask(__name__)

DATA_SIZE = 1000000
DATA_FILE = 'inplace.data'
DATA = []

with open(DATA_FILE, "rb") as f:
    DATA_RAW = f.read()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-data')
def get_data():
    return send_file(io.BytesIO(DATA_RAW), mimetype='application/binary')


@app.route('/paint/<int:x>/<int:y>/<int:r>/<int:g>/<int:b>')
def paint(x, y, r, g, b):
    global DATA, DATA_DUMP
    offset = (x + 1000 * y) * 4
    DATA[offset] = r
    DATA[offset + 1] = g
    DATA[offset + 2] = b
    DATA_DUMP = json.dumps(DATA)
    return 'ok'


@app.route('/regenerate')
def reload_data():
    print("Data regenerating", end='')
    start = time.time_ns()
    global DATA
    DATA = []
    for i in range(DATA_SIZE):
        DATA.append(random.randrange(0, 256))
        DATA.append(random.randrange(0, 256))
        DATA.append(random.randrange(0, 256))
        DATA.append(255)
        if i % 100000 == 0:
            print(".", end='')

    print(' Done!')

    with open(DATA_FILE, 'wb') as f:
        f.write(bytearray(DATA))

    return 'Data regenerated in %s ms' % ((time.time_ns() - start) / 1000000)


if __name__ == '__main__':
    app.run(host='0.0.0.0')
