/**
 * Created by lizhimin on 2017/12/8.
 */
/**
 * Created by zhiyuan on 2016/1/12.
 */
'use strict';
const db =require("../lib/util").db;
const License=db.cwmLicense;
exports.addLicense = function (req, res) {

    License.save(req.body, function (err, data) {
        if (err) {
            res.json({success: false, error: err});
        }
        else {
            res.json({success: true, data: data});
        }
    });
}
exports.delLicense = function (req, res) {
    License.removeById( req.body._id, function (err, data) {
        if (err) {
            res.json({success: false, error: err});
        }
        else {
            res.json({success: true});
        }
    });
}
exports.listLicenses = function (req, res, next) {
    License.findByOrgId(req.body.orgId, function (err, data) {
        if (err) {
            res.json({success: false, error: err});
        }
        else {
            res.json({success: true, data: data});
        }
    });

}