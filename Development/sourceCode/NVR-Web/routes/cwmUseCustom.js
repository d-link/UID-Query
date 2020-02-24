/**
 * Created by guojiangchao on 2017/12/12.
 */
'use strict';

var fs = require('fs');
const db = require("../lib/util").db;
const cwmCustom = db.cwmUserCustom;
const cwmPageAction=db.cwmPageAction;
exports.getUseCustom1 = function (req, res) {
    // let orgId = req.body.orgId;
	let page = req.body.page;
	let subPage = req.body.subPage;
	let path = `/userdata/config/customer/useCustom.js`;
	fs.readFile(path, function(err, data) {
		let d = {};
	    if (err) {
	    	// 初始化useCustom文件
	    	d = {"dashboard": {"overView": {"gridVisible": {"apUsage": [],"lastEvents": []},
	    		"APSelect": {"site": "","network": ""},"LESelect": {"site": "","network": ""}},
	    		"accessPoint": {"gridVisible": {"ap": []},"usageSelect": {"site": "","network": ""},
	    		"searchData": {"type": "","value": ""}},"wirelessClient": {"gridVisible": {"cClients": [],
	    		"bClients": []},"cSelect": {"site":"","network": "","client": "","type": "","value": ""}}},
	    		"monitor": {"map": {}},"notifications": {"triggerSet": {},"notificationSet": {},
	    		"notificationView": {}},"configuration": {},"report": {"networkreport": {},
	    		"devicereport": {}},"log": {"notificationLog": {},"traplog": {},"syslog": {},
	    		"systemlog": {},"devicelog": {}},"system": {"network": {},"deviceManage": {},"team": {}}};	
	    	let baseData = JSON.stringify(d);
	        fs.writeFile(path, baseData, function(err) {});
	    };
	    if (data && data!=''){
			if (data) {
				d= JSON.parse(data);
			}
		}
		let temp=d[page];
		if(temp)  temp=d[page][subPage];
	    return res.json({ success: true, data: temp});
	});
	
};

let data = [{
	page: "dashboard",
	subPage: "overView",
	customData: {
		"gridVisible": {"apUsage": [], "lastEvents": []},
		"APSelect": {"site": "", "network": ""}, "LESelect": {"site": "", "network": ""}
	}
},
	{
		page: "dashboard",
		subPage: "accessPoint",
		customData: {
			"gridVisible": {"ap": []}, "usageSelect": {"site": "", "network": ""},
			"searchData": {"type": "", "value": ""}
		}
	}, {
		page: "dashboard",
		subPage: "wirelessClient",
		customData: {
			"gridVisible": {
				"cClients": [],
				"bClients": []
			}, "cSelect": {"site": "", "network": "", "client": "", "type": "", "value": ""}
		}
	},
	{
		page: "log",
		subPage: "notificationLog",
		customData: {
		}
	},
	{
		page: "log",
		subPage: "traplog",
		customData: {
		}
	},  {
		page: "log",
		subPage: "traplog",
		customData: {
		}
	}
];
exports.getUseCustom = function (req, res) {
	let page = req.body.page;
	let subPage = req.body.subPage;
	cwmCustom.getItemByPage(page,subPage,(err,result)=>{
		let temp={};
		if(result){
			temp=result.customData;
			return res.json({ success: true, data: temp});
		}else{
			for(let i=0;i<data.length;i++){
				if(data[i].page==page&&data[i].subPage==subPage){
					temp=data.customData;
					break;
				}
			}

			return res.json({ success: true, data: temp});
		}
	})

};
exports.setUseCustom = function (req, res) {
	let page = req.body.page;
	let subPage = req.body.subPage;
	let custom = req.body.customData;
	if (!custom) return res.json({ success: true });
	cwmCustom.saveItemByPage(page,subPage,custom,(err,result)=>{});
    return res.json({ success: true });
};

exports.getPageAction = function (req, res) {
	let opeUserId = req.opeUserId;
	cwmPageAction.getUserAction(opeUserId,(err,result)=>{
		result.userId=opeUserId;
		return res.json({ success: true, data: result});
	})

};
exports.setPageAction = function (req, res) {
	let opeUserId = req.opeUserId;
	let action=req.body;
	action.userId=opeUserId;
	cwmPageAction.saveUserAction(opeUserId,action,(err,result)=>{});
    return res.json({ success: true });
};

