/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const db = require("../lib/util").db;
const cwmSite = db.cwmSite;

exports.getSiteByOrg = function (req, res) {
    let orgId = req.body.orgId;
    cwmSite.getSiteByOrgId(orgId, function (err, data) {
        if(err){
            return res.json({success:false, error:err});
        }else{
            data.count = data.length;
            return res.json({success:true, data:data});
        }
    })
};

