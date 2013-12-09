#!/usr/bin/python3

import os, sys
import sqlite3

GET_ALL_INVTYPES = """
SELECT
    invTypes.typeID,
    invTypes.typeName
FROM
    invTypes
"""


def fix_ccp_strings(byte_):
    try:
        str_ = byte_.decode('UTF-8')
    except UnicodeDecodeError as e:
        # :CCP:
        # Some of the description strings are not infact encoded in utf8
        # And instead are encoded in cp1252, whatever this is
        # http://stackoverflow.com/questions/3220957/python-utf8-string-confusion
        # - Answer by John Machin
        str_ = byte_.decode('cp1252')
    except AttributeError:
        str_ = ''

    return str_.encode('utf-8').decode('utf-8')

if __name__ == "__main__":
    db = sqlite3.connect(sys.argv[1])
    db.text_factory = bytes

    cur = db.cursor()

    f = open(sys.argv[2], 'wb')
    f.write(b'#!/usr/bin/python\n# vim: set fileencoding=UTF-8 :\nTYPES = {\n')

    for row in cur.execute(GET_ALL_INVTYPES):
        _id = str(row[0]).encode()
        name = fix_ccp_strings(row[1]).replace("'", "\\'").encode()

        f.write(b"\tu'" + name + b"': " + _id + b",\n")

    f.write(b'}\n')
