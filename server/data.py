from os import path


class Data(object):

    array = bytearray()
    changes = []
    _FILE = 'inplace.data'

    width = 0
    height = 0

    def __init__(self, width, height):
        self.array = bytearray()
        self.width = width
        self.height = height

        if not path.exists(self._FILE):
            self.flush()
        self.load()

    def change(self, json, last_id=0):
        offset = (json['x'] + self.height * json['y']) * 4
        self.array[offset] = json['rgba'][0]
        self.array[offset + 1] = json['rgba'][1]
        self.array[offset + 2] = json['rgba'][2]

        self.changes.append({
            'id': len(self.changes),
            'data': json
        })
        return self.changes[last_id + 1:]

    def load(self):
        with open(self._FILE, 'rb') as f:
            self.array = bytearray(f.read())
        return True

    def dump(self):
        with open(self._FILE, 'wb') as f:
            f.write(self.array)
        return True

    def flush(self):
        self.array = bytearray()
        for i in range(self.width * self.height * 4):
            self.array.append(255)

        return True
