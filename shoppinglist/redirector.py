import webapp2

class RedirectHandler(webapp2.RequestHandler):
    def get(self, to):
        self.redirect(to, permanent=True)

    def head(self, to):
        self.redirect(to, permanent=True)

        
app = webapp2.WSGIApplication(
    [
        webapp2.Route('/inspector/', RedirectHandler, defaults={'to': '/logaggregator'}),
    ])

