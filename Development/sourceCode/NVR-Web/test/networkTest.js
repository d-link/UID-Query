/**********************************************
 * this file is part of DView8 Common Project
 * Copyright (C)2015-2020 D-Link Corp.
 *
 * Author       : HuiMiaomiao
 * Mail         : Miaomiao.Hui@cn.dlink.com
 * Create Date  : 2017/2/14
 * Summary      :
 *
 **********************************************/
const network = require("../controller/network");
const db =require("../lib/util").db;
const DeviceWS = db.DeviceWorkspace;
const Network = db.Network;

var networkInfo={
            orgId:'58a6b26869154dc013caf420',
            name:1,
            mode:['Probe'],//Agent, Probe 支持的类型
            agentUUID:"E064-64B712FA-A37B-66505C4C-AE7A",
            probeUUIDs:['456456'],
            alias:'yyy',//别名 用于导出文件名称
            autoManaged:1,//自动纳管，仅当包含Probe选项时有效
            autoDiscover: {type: 1, default: false},
            interval: 5,
            probe:[{uuid:"CD33-8C50A677-AD8E-CEA70465-F19B"}]
        };

var networkId = "58aabc4fcf43f72c16e03693";

"--------------------------------------------------------------------------"
//probe与前台交换的数据格式
var probeConfig = {
    "networkId":"",
    "probeConfig": {
        "location": "ppp",
        "uuid": "E5FB-375666D9-D2B0-F31F8791-BE3A",
        "ipRange": [
            {
            "type": "range",
            "range": {
                "from": "192.168.0.1",
                "to": "192.168.1.1"
            },
            "subnet": {
                "net": "",
                "mask": "22"
            }
        }, {
            "type": "subnet",
            "range": {
                "from": "",
                "to": ""
            },
            "subnet": {
                "net": "192.168.1.1",
                "mask": "22"
            }
        }],
        "snmpRule": [
            {
            "community": {
                "read": "readc",
                "write": "writec"
            },
            "version": "v1/v2"
        }, {
            "community": {
                "securityLevel": "AuthPriv",
                "authProtocol": "MD5",
                "privProtocol": "DES",
                "securityName": "qq",
                "authPassword": "qq",
                "privPassword": "qq"
            },
            "version": "v3"
        }]
    }
}

var updateNetwork =
{
    alias:"",
    autoDiscover:"",
    autoManaged:"",
    interval:"",
    name:"",
    _id:"",
    probeUUIDs:[] //该network下的probeUUIDs
}

var a =
{
    alias:"",
    autoDiscover:"",
    autoManaged:"",
    interval:"",
    name:"",
    _id:"",
}





