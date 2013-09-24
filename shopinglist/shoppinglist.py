#!/usr/bin/python2.7

import webapp2, lxml.etree
import json, urllib2

from invtypes import TYPES

class GetPricing(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'application/json;charset=UTF-8'

        regions = self.request.get('regions', "10000002").split('\n')

        region = "&regionlimit=".join(regions)

        shopping_list = self.request.get('list', '')

        shopping_list = shopping_list.split('\n')

        errors = {}
        items = {}
        for line in shopping_list:
            if line:
                if line in items.keys():
                    items[line]['count'] = items[line]['count'] + 1
                else:
                    try:
                        t = TYPES[line]
                        items[line] = {}
                        items[line]['name'] = line
                        items[line]['id'] = t
                        items[line]['count'] = 1
                    except KeyError:
                        if 'KeyError' not in errors.keys():
                            errors['KeyError'] = []
                        errors['KeyError'].append(line)

        for item in items.keys():
            url = 'http://api.eve-central.com/api/quicklook'

            req = urllib2.urlopen(url, 'regionlimit=%s&typeid=%s' % (region, items[item]['id']))

            doc = lxml.etree.fromstring(req.read())

            items[item]['bestPrice'] = None
            items[item]['bestLocation'] = None
         
            for i in doc.findall('.quicklook/sell_orders/order'):
                price = 0
                loc = None
         
                for child in i:
                    if str(child.tag) == 'price':
                        price = float(child.text)
                    elif str(child.tag) == 'station_name':
                        loc = child.text
         
                if items[item]['bestPrice'] is None or price > items[item]['bestPrice']:
                    items[item]['bestPrice'] = price
                    items[item]['bestLocation'] = loc

        self.response.write(json.dumps({'data': items, 'errors': errors}))

    def post(self):
        self.get()

app = webapp2.WSGIApplication([
        (r'/app/get_pricing', GetPricing)
    ])
