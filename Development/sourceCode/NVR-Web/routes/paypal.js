/**
 * Created by chencheng on 18-1-15.
 *
 * API for paypal configuration 
 */
'use strict';
const db = require("../lib/util").db;
var paypal = require('paypal-rest-sdk');

//paypal帐号配置参数
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AQU0NMlpojc0BkOYYnFYkAcvnPuhHZcW63-0mpHynyBdH4pn0gpwjRtqsjqXYtiy2--m9U42iFXcYCsX',//'AaU8tQfmz1_MFDTKuf84yYERXvdDt2ZFJVrxhNW_49DazF4A_F0VBuKyV5_nntyEdZqUa5Oq9ZBj65GV',
    'client_secret': 'EC1rPI3u1El9FE5BZz8W9xcJTAa1XUhoR6uf0gNh-VTfmu5sipa0_wDIR_ucoDx_oYLy-PRQ9SlzLGX8'//'EAZ8aFDU4lHHLy1bQqULYWqznf3dBknXZW3AH__zFC0bUs8AGUyR6RNbm-jHvqtikX7PsSqMO5vxuvKm'
});
/*
payment:{
    currencyCode:String,//USD...
        APIUsername:String,
        APIPassword:String,
        APISignature:String,
        options:[
        {
            duration:Number,//单位统一分钟
            cost:Number
        }
    ]
}
*/
exports.getPassCode = function (req, res) {
    /*
    Org.findOrgById(right.orgId, function (err, org) {
        if (err) {
            callback(err)
        }
        if (org) {
            var usd = org.payment.APIUsername;
            right.logo = org.logo;
            right.smtpServer = org.smtpServer;
        }
        callback(null, right);
    });
    */
    //商品参数信息
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "https://localhost:443/#/success",//"https://localhost:443/api/web/cwm/success",
            "cancel_url": "https://localhost:443/#/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "7 day",   //
                    "sku": "001",
                    "price": "1.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "1.00"
            },
            "description": "Hat for the best team ever"
        }]
    };
    //打开付款页面
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for (var i = 0; i < payment.links.length; i++) {
                if (payment.links[i].rel === 'approval_url') {
               //     res.redirect(payment.links[i].href);
                    console.log("getPassCode###" +payment.links[i].href);
                    //return payment.links[i].href;
                    return res.json({ success: true, data: payment.links[i].href });
                }
            }
        }
    });
}
//支付成功处理
exports.paySuccess = function (req, res) {
    console.log('paySuccess');
    var payerId = req.query.PayerID;
    var paymentId = req.query.paymentId;

    var execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1.00"
            }
        }]
    };
    //购买
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            //给paypal服务器应答成功
            res.send('Success');
            res.render('https://127.0.0.1:443/#/paypalExecute', { title: 'Express' });
  //          window.open('https://127.0.0.1:443/#/paypalExecute', '_self');
        }
    });
}

//取消处理
exports.payCancel = function (req, res) {
    return res.send('Cancelled');
}

exports.login = function (req, res) {
    
}
