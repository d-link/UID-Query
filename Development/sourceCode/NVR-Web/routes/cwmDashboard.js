/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const cwmDashboard = require('../cwmcontroller/dashboard');
const db = require("../lib/util").db;
exports.getDeviceStatus = function (req, res) {

};

exports.getStateSummary = function (req, res) {
    let orgId = req.body.orgId;
    let opeUserId = req.opeUserId;
    db.User.getUserRoleById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            cwmDashboard.getStateSummary(opeUser, orgId, (result)=> {
                return res.json(result);
            })
        }
    });


}
exports.getChannelUsedSummary = function (req, res) {
    let opeUserId = req.opeUserId;
    cwmDashboard.getChannelUsedSummary(req.body, opeUserId,(result)=> {
        return res.json(result);
    })
}
exports.getTopApUsage = function (req, res) {
    cwmDashboard.getTopApByUsage(req.body, (result)=> {
        return res.json(result);
    })
}
exports.getLatestEvents = function (req, res) {
    let opeUserId = req.opeUserId;
    cwmDashboard.getLatestEvents(req.body, opeUserId, (result)=> {
        return res.json(result);
    })
}
exports.getClientInfos = function (req, res) {
    let opeUserId = req.opeUserId;
    cwmDashboard.getClientInfos(req.body, opeUserId, (result)=> {
        return res.json(result);
    })
}
exports.getBlockedClientInfos = function (req, res) {
    let opeUserId = req.opeUserId;
    cwmDashboard.getBlockClient(req.body, opeUserId, (result)=> {
        return res.json(result);
    })
}
exports.getAccessPoints = function (req, res) {
    let opeUserId = req.opeUserId;
    let param = req.body.searchRule;
    let page = req.body.page;
    if (!page) {
        page = {start: 0, count: 50};
    } else {
        if (!page.start) page.start = 0;
    }
    cwmDashboard.getAccessPoints(param, page, opeUserId, function (err, data, count, online) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            return res.json({success: true, data: data, total: count, online: online});
        }
    })
}
//ap traffice useage
exports.getAllUsageData = function (req, res) {
    let opeUserId = req.opeUserId;
    let param = req.body.searchRule;
    let time = req.body.time;
    cwmDashboard.getAllUsageData(param, time, opeUserId, function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            return res.json({success: true, data: data});
        }
    })

}
exports.getUsageDataByAP = function (req, res) {
    let mac = req.body.mac;
    let time = req.body.time;
    cwmDashboard.getUsageDataByAP(mac, time, function (err, data) {
        if (err) {
            return res.json({success: false, err: err});
        } else {
            return res.json({success: true, data: data});
        }
    })

}

