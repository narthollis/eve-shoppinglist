"use strict";

if (typeof(net) === "undefined") var net = {};
if (typeof(net.narthollis) === "undefined") net.narthollis = {};
if (typeof(net.narthollis.ajax) === "undefined") net.narthollis.ajax = {};

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

net.narthollis.ajax.Loader = function(options) {
    if (typeof(options) === "undefined") options = {};

    this.options = options;
    for (var key in net.narthollis.ajax.Loader.DEFAULTS) {
        if (!net.narthollis.ajax.Loader.DEFAULTS.hasOwnProperty(key)) continue;

        if (this.options.hasOwnProperty(key)) continue;

        this.options[key] = net.narthollis.ajax.Loader.DEFAULTS[key];
    }

    if (this.options['color'].substr(0,1) == '#') {
        this.options['color'] = hexToRgb(this.options['color']);
    }

    this.canvas = document.createElement('canvas');


    if (window.innerWidth > window.innerHeight) {
        this.canvas.width  = window.innerWidth/4;
        this.canvas.height = window.innerWidth/4;
    } else {
        this.canvas.width  = window.innerHeight/4;
        this.canvas.height = window.innerHeight/4;
    }

    document.body.appendChild(this.canvas);

    this.canvas.style.position = 'fixed';
    this.canvas.style.left = window.innerWidth/2 - this.canvas.width/2 + 'px';
    this.canvas.style.top = window.innerHeight/2 - this.canvas.height/2 + 'px';
    this.canvas.style.zIndex = 100000000;

    this.visible = false;

    var self = this;

    window.requestAnimationFrame(function() { self.onFrame(); });
};

net.narthollis.ajax.Loader.DEFAULTS = {
    'rpm': 30,
    'color': '#004CB3',
    'circles': 1,
    'width': 0.1,
    'margin': 0.02,
    'reduction': 2,
    'segments': 20
};

net.narthollis.ajax.Loader.prototype.show = function() {
    this.visible = true;

    var self = this;
    window.requestAnimationFrame(function() { self.onFrame(); });
};

net.narthollis.ajax.Loader.prototype.hide = function() {
    this.visible = false;
};

net.narthollis.ajax.Loader.prototype.onFrame = function() {
    this.canvas.style.visibility = (this.visible ? 'visible' : 'hidden');

    if (this.visible) {
        var time = new Date().getTime() % 60000; // We only really care aobut this minute

        var ctx = this.canvas.getContext('2d');

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);


        var radius = this.canvas.height/2;
        var centerX = this.canvas.width/2;
        var centerY = this.canvas.height/2;


        var rotationsPerMilisecond = this.options['rpm'] / 60 / 1000;
        var rotationLengthPerMilisecond = (Math.PI*2) * rotationsPerMilisecond;
        var offset = rotationLengthPerMilisecond * time;


        var circles = [];
        for (var i =0; i<this.options['circles']; i++) {
            circles[i] = {};

            var reduction = i * this.options['reduction'];
            if (reduction == 0) reduction = 1;

            circles[i]['outer'] = radius;
            if (typeof(circles[i-1]) !== "undefined") {
                circles[i]['outer'] = circles[i-1]['inner'] - (radius * this.options['margin'] * reduction);
            }

            circles[i]['inner'] = circles[i]['outer'] - (radius * this.options['width'] / reduction);
            
            circles[i]['offset'] = Math.PI*2 / (i+1/this.options['circles']);
        }

        for (var i=0,len=Math.floor(Math.PI*2*this.options['segments']); i<len; i++) {
            var start = (i - 1)/this.options['segments'] + offset;
            var end = i/this.options['segments'] + offset;

            for (var c=0; c<circles.length; c++) {
                var lStart = start + circles[c]['offset'];
                var lEnd = end + circles[c]['offset'];

                ctx.beginPath();

                if (c % 2 == 0) {
                    ctx.arc(centerX, centerY, circles[c]['outer'], lStart, lEnd, false);
                    ctx.arc(centerX, centerY, circles[c]['inner'], lEnd, lStart, true);
                } else {
                    ctx.arc(centerX, centerY, circles[c]['outer'], -lEnd, -lStart, false);
                    ctx.arc(centerX, centerY, circles[c]['inner'], -lStart, -lEnd, true);
                }
            
                ctx.lineWidth = 0;
                ctx.strokeStyle = 'rgba(' + this.options['color']['r'] + ',' +
                    this.options['color']['g'] + ',' +
                    this.options['color']['b'] + ',' +
                    i / len + ')';
                ctx.stroke();

                ctx.fillStyle = 'rgba(' + this.options['color']['r'] + ',' +
                    this.options['color']['g'] + ',' +
                    this.options['color']['b'] + ',' +
                    i / len + ')';
                
                ctx.fill();
            }
        }

        var self = this;
        window.requestAnimationFrame(function() { self.onFrame(); });
    };
};

var Loader = new net.narthollis.ajax.Loader({
        circles: 7,
        margin: 0.01,
        reduction: 1,
        rpm: 10,
        segments: 1,
        width: 0.2
    });

jQuery(document).ajaxStart(function() { Loader.show(); });
jQuery(document).ajaxComplete(function() { Loader.hide(); });