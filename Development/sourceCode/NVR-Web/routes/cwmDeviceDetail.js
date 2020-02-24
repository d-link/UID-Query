/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const cwmDeviceDetailC = require('../cwmcontroller/deviceDetail');
const db = require("../lib/util").db;


exports.getDeviceInfo = function (req, res) {
    let devId = req.body.devId;
    cwmDeviceDetailC.getDeviceInfo(devId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.updateDeviceInfo = function (req, res) {
   /* let opeUserId = req.opeUserId;
    db.User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {
*/
                let devMac = req.body.devMac;
                cwmDeviceDetailC.updateDeviceInfo(devMac, req.body, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true});
                    }
                })
           /* }
        }
    });*/

};

exports.getDeviceNotify = function (req, res) {
    let devId = req.body.devId;
    cwmDeviceDetailC.getDeviceNotify(devId, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
};
exports.getClientsInfo = function (req, res) {
    let devMAC = req.body.devMAC;
    cwmDeviceDetailC.getClientsInfo(devMAC, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    })
}
exports.blockClient = function (req, res) {
  /*  let opeUserId = req.opeUserId;
    db.User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {*/

                let uuid = req.body.uuid;
                let sessionId = req.body.sessionId;
                let wlanId = req.body.wlanId;
                let band = req.body.band;
                let clientMACAddr = req.body.clientMACAddr.toUpperCase();
                cwmDeviceDetailC.blockClient(uuid, sessionId, wlanId, band, clientMACAddr, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
          /*  }
        }
    });*/

}
exports.unblockClient = function (req, res) {
/*    let opeUserId = req.opeUserId;
    db.User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {*/

                let uuid = req.body.uuid;
                let wlanId = req.body.wlanId;
                let clientMAC = req.body.clientMACAddr.toUpperCase();
                cwmDeviceDetailC.unblockClient(uuid, wlanId, clientMAC, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                })
       /*     }
        }
    });*/

}
exports.renameClient = function (req, res) {
   /* let opeUserId = req.opeUserId;
    db.User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            if ((opeUser.role == "local admin" && opeUser.privilege && !opeUser.privilege.find(t=>t == req.body.networkId))
                || opeUser.role == "root user" || opeUser.role == "local user" || opeUser.role == "front desk user") {
                return res.json({success: false, error: -1});
            } else {*/

                let devMac = req.body.devMac;
                let clientMAC = req.body.clientMACAddr.toUpperCase();
                let newName = req.body.name;
                cwmDeviceDetailC.renameClient(devMac, clientMAC, newName, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
          /*  }
        }
    });*/

}

exports.getSupplierInfo = function(req, res) {
    let supplierId = req.body.supplierId;
    cwmDeviceDetailC.getSupplierInfo(supplierId, function(err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true, data: data});
        }
    });
}

