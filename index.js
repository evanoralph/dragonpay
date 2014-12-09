var dragonpay = require('./dragonpay')('LOVABLE2', '9F21s2eC5x');
var http = require('http');
var string = require('eden-string');
http.createServer(function(request, response) {
    var query = string().pathToQuery(request.url);
    if(query.status) {
        console.log(query);
        dragonpay.cancelOrder(query.txnid, function(err, res, req) {
            console.log(err);
            console.log(res);
        });
        response.end();
    }

    var options = {
        param1 : 'param1',
        param2 : 'param2'
    };

    var template = dragonpay.checkout('2', 'jernonmagcalas@gmail.com', 50, 'description', options);
    response.writeHead(302, {"Location" : template});
    response.end();
}).listen(8888);