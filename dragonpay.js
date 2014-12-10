module.exports = require('eden-class').extend(function() {
    /* Require
     -------------------------------*/
    var string = require('eden-string');
    var rest = require('eden-rest');

    /* Constants
     -------------------------------*/
    this.LIVE_PAYMENT_URL = 'https://gw.dragonpay.ph/Pay.aspx';
    this.TEST_PAYMENT_URL = 'http://test.dragonpay.ph/Pay.aspx';

    this.LIVE_REQUEST_URL = 'https://gw.dragonpay.ph/MerchantRequest.aspx';
    this.TEST_REQUEST_URL = 'http://test.dragonpay.ph/MerchantRequest.aspx';

    this.OPERATION_STATUS = 'GETSTATUS';
    this.OPERATION_CANCEL = 'VOID';

    /* Public Properties
     -------------------------------*/
    /* Protected Properties
     -------------------------------*/
    /* Private Properties
     -------------------------------*/
    var __noop = function() {};
    var ___config = {};

    /* Magic
     -------------------------------*/
    this.___construct = function(merchantId, secret, live) {
        this.argument()
            .test(1, 'string')
            .test(2, 'string');

        ___config = {
            merchantId: merchantId,
            secret: secret,
            live: live || false
        };
    };

    /* Public Methods
     -------------------------------*/
    /**
     * Cancel a pending order only
     *
     * @param string merchant order id
     * @param function callback
     *
     * @return 	integer return 0 if success negative if failed
     */
    this.cancelOrder = function(txnid, callback) {
        var data = {
            op : this.OPERATION_CANCEL,
            merchantid : ___config.merchantId,
            merchantpwd : ___config.secret,
            txnid : txnid
        };

        var url = this.TEST_REQUEST_URL;
        if(___config.live) {
            url = this.LIVE_REQUEST_URL;
        }

        rest().setUrl(url + '?' + string().hashToQuery(data))
            .getResponse(callback || __noop);
    };

    /**
     * Cancel a pending order only
     *
     * @param string merchant order id
     * @param string user email
     * @param float amount
     * @param string purchase description
     * @param object additional options
     *      param1, param2, ccy, mode, procid
     *
     * @return 	integer return 0 if success negative if failed
     */
    this.checkout = function(txnid, email, amount, description, options) {
        this.argument()
            .test(1, 'string')
            .test(2, 'string')
            .test(3, 'number')
            .test(4, 'string');

        options = options || {};



        var data = {
            merchantid : ___config.merchantId,
            txnid : txnid,
            amount : amount.toFixed(2),
            ccy : 'PHP',
            description : description,
            email : email
        }

        // set the currency PHP or USD only
        if(options.hasOwnProperty('currency')) {
            data.ccy = options.currency
        }

        // set additional data to be sent back in the callback
        if(options.hasOwnProperty('param1')) {
            data.param1 = options.param1;
        }

        // set additional data to be sent back in the callback
        if(options.hasOwnProperty('param2')) {
            data.param2 = options.param2;
        }


        // Filtering Payment Channels
        // 1 = Online Banking
        // 2 = Over-the-Counter Banking and ATM
        // 4 = Over-the-Counter non-Bank
        // 8 = (unused)
        // 16 = (reserved internally)
        // 32 = PayPal
        // 64 = Credit Cards
        // 128 = Mobile (Gcash)
        // 256 = International OTC
        if(options.hasOwnProperty('mode')) {
            data.mode = options.mode;
        }

        // Pre-selecting Payment Channels
        // only available with ff:
        // GCSH = Globe Gcash
        // CC = Credit Cards
        // PYPL = PayPal
        if(options.hasOwnProperty('procid')) {
            data.procid = options.procid;
        }

        data.digest = ___generatePaymentDigest.call(this, txnid, amount, data.ccy, description, email);

        // use live payment or sandbox
        var url = this.TEST_PAYMENT_URL;
        if(___config.live) {
            url = this.LIVE_PAYMENT_URL;
        }

        return url + '?' + string().hashToQuery(data);
    };

    /**
     *
     * Get the status of the order
     *
     * @param string merchant order id
     * @param function request callback
     *
     * @return string
     * S Success
     * F Failure
     * P Pending
     * U Unknown
     * R Refund
     * K Chargeback
     * V Void
     * A Authorized
     */
    this.getStatus = function(txnid, callback) {
        var data = {
            op : this.OPERATION_STATUS,
            merchantid : ___config.merchantId,
            merchantpwd : ___config.secret,
            txnid : txnid
        };

        var url = this.TEST_REQUEST_URL;
        if(___config.live) {
            url = this.LIVE_REQUEST_URL;
        }

        rest().setUrl(url + '?' + string().hashToQuery(data))
            .getResponse(callback || __noop);
    }

    /**
     *
     * check if the digest in the request is valid
     *
     * @param Object merchant order id
     * (digest, txnid, refno, status, message)
     *
     * @param bool
     */
    this.isValidDigest = function(query) {
        var digest = query.digest || null;
        var txnid = query.txnid || null;
        var refno = query.refno || null;
        var status = query.status || null;
        var message = query.message || null;

        if(digest != ___generateRequestDigest.call(this, txnid, refno, status, message)) {
            return false;
        }

        return true;
    };

    /* Protected Methods
     -------------------------------*/
    /* Private Methods
     -------------------------------*/
    var ___generatePaymentDigest = function(txnId, amount, currency, description, email) {
        var format = '{0}:{1}:{2}:{3}:{4}:{5}:{6}'
            .replace('{0}', ___config.merchantId)
            .replace('{1}', txnId)
            .replace('{2}', amount.toFixed(2))
            .replace('{3}', currency)
            .replace('{4}', description)
            .replace('{5}', email)
            .replace('{6}', ___config.secret);

        return string().sha1(format);
    }

    var ___generateRequestDigest = function(txnId, refno, status, message) {
        var format = '{0}:{1}:{2}:{3}:{4}'
            .replace('{0}', txnId)
            .replace('{1}', refno)
            .replace('{2}', status)
            .replace('{3}', message)
            .replace('{4}', ___config.secret);

        return string().sha1(format);
    }

}).register('eden/dragonpay');