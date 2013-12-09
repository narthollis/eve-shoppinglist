#!/usr/bin/python2.7

import webapp2, lxml.etree
import json, urllib2, re, datetime

from invtypes import TYPES

class GetPricing(webapp2.RequestHandler):
    hasCount = re.compile('.* x([0-9]+)$')

    def get(self):
        self.response.headers['Content-Type'] = 'application/json;charset=UTF-8'

        regions = self.request.get('regions', "10000002").split('\n')

        region = "&regionlimit=".join(regions)

        shopping_list = self.request.get('list', '')

        shopping_list = shopping_list.split('\n')


        parsed_list = []
        for line in shopping_list:
            try:
                if line.index(',') >= 0:
                    # Handle EFT Ship line
                    if line.startswith('['):
                        # Strip leading and trailing [], split on , use first index
                        parsed_list.append(line[1:][:-1].split(',')[0].strip())
                    else:
                        module, charge = line.split(',')
                        parsed_list.append(module.strip())
                        parsed_list.append(charge.strip())

            except ValueError:
                parsed_list.append(line)

        errors = {}
        items = {}
        for line in parsed_list:
            if line:

                qty = 1

                res = self.hasCount.match(line)
                if res:
                    qty = int(res.group(1))

                    line = line[0:-(len(res.group(1))+2)]

                if line in items.keys():
                    items[line]['count'] = items[line]['count'] + qty
                else:
                    try:
                        t = TYPES[line]
                        items[line] = {}
                        items[line]['name'] = line
                        items[line]['id'] = t
                        items[line]['count'] = qty
                    except KeyError:
                        if 'KeyError' not in errors.keys():
                            errors['KeyError'] = []
                        errors['KeyError'].append(line)

        today = datetime.date.today()
        now = datetime.datetime.now()

        for item in items.keys():
            url = 'http://api.eve-central.com/api/quicklook'

            req = urllib2.urlopen(url, 'regionlimit=%s&typeid=%s' % (region, items[item]['id']))

            doc = lxml.etree.fromstring(req.read())

            items[item]['bestPrice'] = None
            items[item]['bestLocation'] = None
         
            for i in doc.findall('.quicklook/sell_orders/order'):
                price = 0
                loc = None
                timeReported = None
         
                for child in i:
                    if str(child.tag) == 'expires':
                        (year,month,day) = str(child.text).split('-')

                        expired = today > datetime.date(int(year), int(month), int(day))
                    elif str(child.tag) == 'reported_time':
                        timeReported = datetime.datetime.strptime(now.strftime('%Y-') + child.text, '%Y-%m-%d %H:%M:%S')
                    elif str(child.tag) == 'price':
                        price = float(child.text)
                    elif str(child.tag) == 'station_name':
                        loc = child.text
                
                if expired:
                    continue

                if items[item]['bestPrice'] is None or price < items[item]['bestPrice']:
                    items[item]['bestPrice'] = price
                    items[item]['bestLocation'] = loc
                    items[item]['timeReported'] = timeReported.strftime('%H:%M %d/%m/%Y')
                    diff = (now - timeReported)
                    items[item]['diff'] = {'days': diff.days, 'seconds': diff.seconds}

        self.response.write(json.dumps({'data': items, 'errors': errors}))

    def post(self):
        self.get()

app = webapp2.WSGIApplication([
        (r'/app/get_pricing', GetPricing)
    ])
