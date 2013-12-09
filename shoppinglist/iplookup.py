#!/usr/bin/python2.7

import webapp2
import json

import logging

from dns import reversename, resolver, exception


logger = logging.getLogger(__name__)


class Resolver(object):
    
    resolver = None

    @classmethod
    def reverse(cls, address):
        if not cls.resolver:
            cls.resolver = resolver.Resolver()
            cls.resolver.nameservers = ['8.8.8.8', '8.8.4.4']

        rev_name = reversename.from_address(address.strip())
        print rev_name
        response = cls.resolver.query(rev_name, "PTR", raise_on_no_answer=True)
        
        return str(response[0])


class ReverseIP(webapp2.RequestHandler):

    def get(self):
        self.response.headers['Content-Type'] = 'application/json;charset=UTF-8'

        ips = self.request.get('ips', '').split(',')

        items = {}
        errors = {}

        for ip in ips:
            try:
                items[ip] = Resolver.reverse(ip)
            except exception.DNSException, e:
                errors[ip] = str(e) if str(e) else repr(e)
            except IndexError:
                errors[ip] = 'Reverse not found'

        self.response.write(json.dumps({'data': items, 'errors': errors}))

    def post(self):
        self.get()

app = webapp2.WSGIApplication([
        (r'/ip/reverseip', ReverseIP)
    ])
