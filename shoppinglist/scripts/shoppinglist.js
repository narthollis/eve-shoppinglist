
Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator, currencySymbol) {
        var n = this,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        currencySymbol = currencySymbol == undefined ? "$" : currencySymbol,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
        return sign + currencySymbol + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    };

(function($) {

    var textarea = null;
    var regionlist = null;
    var button = null;

    var tbody = null;
    var grandTotal = null;

    var errorlist = null;
    var errormodel = null;

    var onClick = function(event) {
        if (textarea == null ||
            button == null ||
            tbody == null ||
            grandTotal == null) return;

        tbody.empty();
        errorlist.empty();
        grandTotal.text('0 ISK');

        $.ajax({
                'url': 'app/get_pricing',
                'type': 'POST',
                'data': {
                    'list': textarea.val(),
                    'regions': regionlist.val().join('\n')
                },
                'success': onResponse
            });
    };

    var onResponse = function(data) {

        var total = 0;

        for (var i in data['data']) {
            if (!data['data'].hasOwnProperty(i)) continue;

            var found = data['data'][i]['bestLocation'] !== null;

            var loc = (found ? data['data'][i]['bestLocation'] : 'Not Found');

            var bestPrice = (found ? parseFloat(data['data'][i]['bestPrice']) : 0);
            var count = parseInt(data['data'][i]['count']);

            var dateClass = '';
            if (found) {
                if (data['data'][i]['diff']['days'] > 5) {
                    dateClass = 'danger';
                } else if (data['data'][i]['diff']['days'] > 1) {
                    dateClass = 'warning';
                }
            }

            var subtotal = bestPrice * count
            total = total + subtotal;

            var tr = $('<tr class="' + dateClass + '"></tr>');

            tr.append('<td>' + data['data'][i]['count'] + '</td>');
            tr.append('<td><a href="http://www.eve-central.com/home/quicklook.html?typeid=' + data['data'][i]['id'] + '">' + data['data'][i]['name'] + '</a></td>');
            tr.append('<td>' + loc + '</td>');
            tr.append('<td>' + (found ? bestPrice.formatMoney(2, ',', '.', '') + ' ISK' : 'Not Found') + '</td>');
            tr.append('<td>' + (found ? subtotal.formatMoney(2, ',', '.', '') + ' ISK' : 'Not Found') + '</td>');
            tr.append('<td>' + (found ? data['data'][i]['timeReported'] : 'Not Found') + '</td>');

            tbody.append(tr);
        }

        if (data['errors'].hasOwnProperty('KeyError')) {
            for (var i in data['errors']['KeyError']) {
                errorlist.append('<li>' + data['errors']['KeyError'][i] + '</li>');
            }

            errormodel.modal('show');
        }

        grandTotal.text(total.formatMoney(2, ',', '.', '') + ' ISK');

    };

    $.fn.ShoppingListButton = function() {
        button = this;

        button.bind('click', onClick);
    };

    $.fn.ShoppingListTextArea = function() {
        textarea = this;
    };

    $.fn.ShoppingListRegionList = function() {
        regionlist = this;
    };

    $.fn.ShoppingListTBody = function() {
        tbody = this;
    };

    $.fn.ShoppingListGrandTotal = function() {
        grandTotal = this;
    };

    $.fn.ShoppingListErrorList = function() {
        errorlist = this;
    };

    $.fn.ShoppingListErrorModel = function() {
        errormodel = this;
    };

}(jQuery));
