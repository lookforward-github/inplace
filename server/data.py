from os import path


class Data(object):

    array = bytearray()
    _FILE = 'inplace.data'

    def __init__(self, size):
        self.array = bytearray()
        if not path.exists(self._FILE):
            self.flush(size)
        self.load()

    def change(self, offset, r, g, b):
        self.array[offset] = r
        self.array[offset + 1] = g
        self.array[offset + 2] = b
        return True

    def load(self):
        with open(self._FILE, 'rb') as f:
            self.array = bytearray(f.read())
        return True

    def dump(self):
        with open(self._FILE, 'wb') as f:
            f.write(self.array)
        return True

    def flush(self, size):
        from random import random
        print('Flushing', end='')
        self.array = bytearray()
        for i in range(size):
            self.array.append(255)
            self.array.append(255)
            self.array.append(255)
            self.array.append(255)
            if i % 100000 == 0:
                print('.', end='')

        print(' Done!')

        return True
