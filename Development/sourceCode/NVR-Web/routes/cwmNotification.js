/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const db = require("../lib/util").db;
const cwmNotifyAlert = db.cwmNotifyAlert;
const cwmNotifySubscribeRule = db.cwmNotifySubscribeRule;
const cwmNotificationC = require('../cwmcontroller/notification');

exports.getAllNotification = function (req, res) {
    let orgId = req.body.orgId;
    cwmNotificationC.getAllNotification(orgId, (err,result) => {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: result});
        }
    })
};

exports.getEventsByIds = function (req, res) {
    let orgId = req.body.orgId;
    let type = req.body.monitorType;
    let eventIds = req.body.eventIds;
    cwmNotificationC.getEventsByIds(orgId, type, eventIds, (err, result) => {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: result});
        }
    })
}
exports.getAllSystemEvent = function (req, res) {
    let orgId = req.body.orgId;
    cwmNotificationC.getAllSystemEvent(orgId, (result) => {
        return res.json(result);
    })
};
//按级别分组读取告警数量
exports.getNotificationCount = function (req, res) {
    let orgId = req.body.orgId;
    cwmNotificationC.getEventCount(orgId, (result) => {
        return res.json(result);
    })
};
//标记告警为已处理
exports.acknowledge = function (req, res) {
    let noteIds = req.body.alertIds;
    let user=req.body.userName;
    cwmNotifyAlert.acknowledgeNotify(noteIds, user,(err, result) => {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    })
};

exports.updateNotifyRule = function (req, res) {
    let notifyInfo = req.body.notifyInfo;
    let product = req.params.product;
    cwmNotifySubscribeRule.updateRule(notifyInfo, function (err, data) {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    })
}

exports.getNotifyRule = function (req, res) {
    let orgId = req.body.orgId;
    cwmNotificationC.getNotifyRulesByOrgId(orgId, function (err, data) {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    });
}

exports.createNotifyRule = function (req, res) {
    let notifyInfo = req.body.notifyInfo;
    let product = req.params.product;
    cwmNotifySubscribeRule.create(notifyInfo, function (err, data) {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    })
}

exports.deleteNotifyRule = function (req, res) {
    let _id = req.body._id;
    cwmNotifySubscribeRule.removeById(_id, function (err, data) {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    })
};

exports.getMoniterItems = function (req, res) {
    cwmNotificationC.getMoniterItems(function (err, data){
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    });
}

exports.editNotifyRuleStatus = function (req, res) {
    cwmNotifySubscribeRule.setRuleStatus(req.body._id, req.body.status, function (err, data) {
        if(err){
            return res.json({success: false, error: err});
        }else{
            return res.json({success: true, data: data});
        }
    });
}