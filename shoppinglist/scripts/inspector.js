
(function($) {

    var textarea = null;
    var button = null;

    var tbody = null;

    var errorlist = null;
    var errormodel = null;

    var SERVICES = {
        '162.243.108.11': '<b>GoonSwarm Services</b>',
        '162.243.86.192': '<b>GoonSwarm Services</b>',
        '119.9.13.223': '<b>Sundering ECM</b> or <b>evething.narthollis.net</b>',
        '198.50.153.201': '<b>EVSCO</b> (eve-kill, zKillBoard)',
        '192.95.19.71': '<b>EVSCO</b> (eve-kill, zKillBoard)',
        '198.27.65.87': '<b>EVSCO</b> (eve-kill, zKillBoard)',
        '192.95.19.70': '<b>EVSCO</b> (eve-kill, zKillBoard)',
        '82.192.91.225': '<b>adashboard</b>',
    };

    var __IP_CACHE = { };


    var resolve_name = function(ip, td) {
        if (typeof(SERVICES[ip]) !== 'undefined') {
            td.html(SERVICES[ip]);
            return
        }
        
        if (typeof(__IP_CACHE[ip]) !== 'undefined') {
            td.text(__IP_CACHE[ip]);
            return
        }

        $.ajax({
            'url': '/ip/reverseip',
            'type': 'POST',
            'data': {
                'ips': ip,
            },
            'success': function(data) { onReverseResponse(ip, td, data); }
        });
    };

    var onReverseResponse = function(ip, td, data) {
        if (typeof(data['data'][ip]) === 'undefined') {
            td.text('Error during lookup: ' + data['errors'][ip]);
        } else {
            td.text(data['data'][ip]);
        }
    };

    var onClick = function(event) {
        if (textarea == null ||
            button == null ||
            tbody == null) return;

        tbody.empty();
        errorlist.empty();

        var lines = textarea.val().split('\n');

        var agg = {};

        for(var i=0,len=lines.length; i<len; i++) {
            var line = lines[i].trim()
            if (line.substr(0, 11) == "Date & Time") continue;

            var bits = line.split('\t');

            var timestamp = bits[0]; //new Date(bits[0] + ' UTC');
            var address = bits[1];

            if (typeof(agg[address]) === 'undefined') {
                agg[address] = {
                    'first_hit': timestamp,
                    'last_hit': timestamp,
                    'hit_count': 1,
                };
            } else {
                if (new Date(agg[address]['first_hit']) > new Date(timestamp)) agg[address]['first_hit'] = timestamp;
                if (new Date(agg[address]['last_hit']) < new Date(timestamp)) agg[address]['last_hit'] = timestamp;
                
                agg[address]['hit_count'] = agg[address]['hit_count'] + 1;
            }
        }

        delete agg['undefined'];

        for (var ip in agg) {
            if (!agg.hasOwnProperty(ip)) continue;

            var tr = $('<tr></tr>');
            tr.append($('<td>' + agg[ip]['first_hit'] + '</td>'));
            tr.append($('<td>' + agg[ip]['last_hit'] + '</td>'));
            tr.append($('<td>' + agg[ip]['hit_count'] + '</td>'));
            var name_td = $('<td>Pending...</td>');
            tr.append(name_td);
            tr.append($('<td>' + ip + '</td>'));

            tbody.append(tr);

            resolve_name(ip, name_td);
        }
    };

    $.fn.LogAggregateButton = function() {
        button = this;

        button.bind('click', onClick);
    };

    $.fn.LogAggregateTextArea = function() {
        textarea = this;
    };

    $.fn.LogAggregateTBody = function() {
        tbody = this;
    };

    $.fn.LogAggregateErrorList = function() {
        errorlist = this;
    };

    $.fn.LogAggregateErrorModel = function() {
        errormodel = this;
    };

}(jQuery));
