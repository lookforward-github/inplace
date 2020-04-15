from flask import Flask, render_template, send_file
import random
import io
import time
from os import path

app = Flask(__name__)

DATA_SIZE = 1000000
DATA_FILE = 'inplace.data'


def regenerate():
    global DATA_RAW
    print('Data regenerating', end='')
    start = time.time()
    DATA_RAW = bytearray()
    for i in range(DATA_SIZE):
        DATA_RAW.append(random.randrange(0, 256))
        DATA_RAW.append(random.randrange(0, 256))
        DATA_RAW.append(random.randrange(0, 256))
        DATA_RAW.append(255)
        if i % 100000 == 0:
            print('.', end='')

    print(' Done!')

    with open(DATA_FILE, 'wb') as f:
        f.write(DATA_RAW)

    print('Data regenerated in %s s' % (time.time() - start))

    return True


if not path.exists(DATA_FILE):
    regenerate()

with open(DATA_FILE, 'rb') as f:
    DATA_RAW = bytearray(f.read())


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-data')
def get_data():
    return send_file(io.BytesIO(DATA_RAW), mimetype='application/binary')


@app.route('/paint/<int:x>/<int:y>/<int:r>/<int:g>/<int:b>')
def paint(x, y, r, g, b):
    offset = (x + 1000 * y) * 4
    DATA_RAW[offset] = r
    DATA_RAW[offset + 1] = g
    DATA_RAW[offset + 2] = b
    return 'ok'


@app.route('/regenerate')
def regenerate_data():
    regenerate()
    return 'ok'


if __name__ == '__main__':
    app.run(host='0.0.0.0')
