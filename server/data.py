import json
from os import path


class Data(object):

    array = bytearray()
    history = []
    _FILE = 'inplace.data'
    _FILE_HISTORY = 'inplace.data_history'

    width = 0
    height = 0

    def __init__(self, width, height):
        self.array = bytearray()
        self.width = width
        self.height = height

        if not path.exists(self._FILE) or not path.exists(self._FILE_HISTORY):
            self.flush()

        self.load()

    def change(self, json_data, last_id=0):
        offset = (json_data['x'] + self.height * json_data['y']) * 4
        self.array[offset] = json_data['rgba'][0]
        self.array[offset + 1] = json_data['rgba'][1]
        self.array[offset + 2] = json_data['rgba'][2]

        self.history.append({
            'id': len(self.history),
            'data': json_data
        })
        print(last_id + 1)
        return self.history[last_id + 1:]

    def load(self):
        with open(self._FILE, 'rb') as f:
            self.array = bytearray(f.read())
        with open(self._FILE_HISTORY, 'r') as f:
            self.history = json.load(f)
        return True

    def dump(self):
        with open(self._FILE, 'wb') as f:
            f.write(self.array)
        with open(self._FILE_HISTORY, 'w') as f:
            json.dump(self.history, f)
        return True

    def flush(self):
        self.array = bytearray()
        for i in range(self.width * self.height * 4):
            self.array.append(255)
        self.history = []

        self.dump()

        return True
