from flask import Flask, render_template, send_file
import io

from server.data import Data

app = Flask(__name__)

CANVAS_HEIGHT = 1000
CANVAS_WIDTH = 1000
data = Data()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get-data')
def get_data():
    return send_file(io.BytesIO(data.array), mimetype='application/binary')


@app.route('/paint/<int:x>/<int:y>/<int:r>/<int:g>/<int:b>')
def paint(x, y, r, g, b):
    offset = (x + 1000 * y) * 4
    data.change(offset, r, g, b)
    return 'ok'


@app.route('/regenerate')
def regenerate_data():
    data.generate_random(CANVAS_HEIGHT * CANVAS_WIDTH)
    return 'ok'


if __name__ == '__main__':
    app.run(host='0.0.0.0')
