
import sys, json, http.client, xml.etree.ElementTree

skills = json.load(open('skills.json'))

name_to_skill = {}

for typeid,skill in skills.items():
    name_to_skill[skill['name']] = typeid

f = open(sys.argv[1])

items = {}
for line in f:
    line = line.strip()
    if line:
        if line in items.keys():
            items[line] = items[line] + 1
        else:
            items[line] = 1


conn = http.client.HTTPConnection('api.eve-central.com')

for item,count in items.items():

    conn.request('GET', '/api/quicklook?regionlimit=10000002&typeid=%s' % (name_to_skill[item]))
    response = conn.getresponse()

    data = b""
    while not response.closed:
        data = data + response.read(200)

    doc = xml.etree.ElementTree.fromstring(data)

    bestPrice = None
    bestLocation = None

    for i in doc.findall('.quicklook/sell_orders/order'):
        price = 0
        loc = None

        for child in i:
            if str(child.tag) == 'price':
                price = float(child.text)
            elif str(child.tag) == 'station_name':
                loc = child.text

        if bestPrice is None or price > bestPrice:
            bestPrice = price
            bestLocation = loc

    print('%d\t%s\t%s\t%s' % (count, item, bestPrice, bestLocation))
    
