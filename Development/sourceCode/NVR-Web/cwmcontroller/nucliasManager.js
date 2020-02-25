/**
 * Create by Redd Lin on 2019/02/11
 */

'use strict';
const util = require("../lib/util");
const db = util.db;
const systemCli = util.common.systemCli;
const User = db.User;
const cwmOrg = db.cwmOrg;
const firmware = db.Firmware;
const cwmNCStats = db.cwmNCStats;
const cwmSSOStatus = db.cwmSSOStatus;
const cwmSSOStatusHistory = db.cwmSSOStatusHistory;
const cwmSSOInfo = db.cwmSSOInfo;
const dashboardC = require("./dashboard");
const tokenmanager = require("../lib/tokenManager");
const os = require('os');
const async = require('async');
const rp = require('request-promise');
const forge = require('node-forge');
//引入url模块解析url字符串
const url = require('url');
//引入querystring模块处理query字符串
const querystring = require('querystring');
const nuclias_api_prefix = 'api/v1';
const nuclias_auth_basic = 'Q0xDVlhZRktBU1JLUlBBVjphOTNlNmY5NzE4ZDk3YmM5Yzc2YjNkM2ZmNzNlZjNkNA==';
const nuclias_client_secret = 'a93e6f9718d97bc9c76b3d3ff73ef3d4';
const validator = require('validator');
const hostname = `API.euqa.nuclias.com`;
//const hostname = `us2-rdqa.nuclias.com`;
const regesterUrl = `https://${hostname}`;
const expiresInSeconds = 60 * 3 * 24 * 60; //3 days
/**
 * //////////////////////////////Nuclias////////////////////////////////
 */
function getNucliasPublicKeyFun(callback) {
    const options = {
        method: 'GET',
        uri: `https://${hostname}/oauth/publicKey`,
        rejectUnauthorized: false,
        json: true
    };
    rp(options)
        .then(function (body) {
            callback({success: true, data: body.data});
        })
        .catch(function (err) {
            if(err.error&&err.error.error){
                callback({ success: false, error: {statusCode: err.statusCode, ...err.error.error}});
            }
            else if(err.error&&!err.error.error){
                callback({ success: false, error: {statusCode: err.statusCode, ...err.error}});
            }
            else{
                callback({ success: false, error: {statusCode: err.statusCode, ...err}});
            }
        });
}

/**
 * get Nuclias PublicKey
 */
function getNucliasPublicKey(req, res, next) {
    getNucliasPublicKeyFun((result) => {
        return res.json(result);
    })

}

function getConnectToken(body, callback) {
    let publicKey = body.publicKey;//get Public key返回的结果
    let username = body.userName;
    let password = body.password;
    password = util.decrptyMethod(username, password);
    let key = '-----BEGIN RSA PUBLIC KEY-----';
    key += publicKey;
    key += '-----END RSA PUBLIC KEY-----';
    try {
        let makePublicKey = forge.pki.publicKeyFromPem(key);
        let plaintextPassword = forge.util.encodeUtf8(password);
        let encryptedPassword = forge.util.encode64(makePublicKey.encrypt(plaintextPassword));
        console.log(`encryptedPassword   ${encryptedPassword}`);
        const options = {
            method: 'POST',
            url: `https://${hostname}/oauth/token`,
            headers: {
                'Authorization': 'Basic ' + nuclias_auth_basic,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'grant_type': 'password',
                'username': username,
                'password': encryptedPassword,
                'client_secret': nuclias_client_secret
            },
            rejectUnauthorized: false,
            json: true
        };

        rp(options)
            .then(function (body) {
                if(body.error&&body.error.error){
                    console.log('SSO login failed: ' + body.error.error);
                    return callback({ success: false, error: {statusCode: body.statusCode, ...body.error.error}});
                }
                else if(body.error&&!body.error.error){
                    console.log('SSO login failed: ' + body.error);
                    return callback({ success: false, error: {statusCode: body.statusCode, ...body.error}});
                }
                else {
                    console.log('SSO login success');
                    return callback({ success: true, data: body });
                }
            })
            .catch(function (err) {
                // Crawling failed...
                console.log('SSO login failure: ' + err);
                // res.json({success: false, error: err});
                if (err.statusCode == 307) {   // 帳號註冊的地方不在option.uri這個位置，所以Nuclias會要求redirect，這邊判斷是不是(statusCode=307)，是的話再帶一次剛剛的登入資料到指定redirect的uri去
                    options.uri = err.response.headers.location;
                    rp(options)
                        .then(function (body2) {
                            if(body2.error&&body2.error.error){
                                console.log('SSO login failed: ' + body2.error.error);
                                return callback({ success: false, error: {statusCode: body2.statusCode, ...body2.error.error}});
                            }
                            else if(body2.error&&!body2.error.error){
                                console.log('SSO login failed: ' + body2.error);
                                return callback({ success: false, error: {statusCode: body2.statusCode, ...body2.error}});
                            }
                            else{
                                console.log('SSO login success');
                                return callback({ success: true, data: body2 });
                            }
                        })
                        .catch(function (err2) {
                            if(err2.error&&err2.error.error){
                                console.log('SSO login failed: ' + err2.error.error);
                                return callback({ success: false, error: {statusCode: err2.statusCode, ...err2.error.error}});
                            }
                            else if(err2.error&&!err2.error.error){
                                console.log('SSO login failed: ' + err2.error);
                                return callback({ success: false, error: {statusCode: err2.statusCode, ...err2.error}});
                            }
                            else{
                                console.log('SSO login failed: ' + err2);
                                return callback({ success: false, error: {statusCode: err2.statusCode, ...err2}});
                            }
                        });
                } else {
                    if(err.error&&err.error.error){
                        console.log('SSO login failed: ' + err.error.error);
                        return callback({ success: false, error: {statusCode: err.statusCode, ...err.error.error}});
                    }
                    else if(err.error&&!err.error.error){
                        console.log('SSO login failed: ' + err.error);
                        return callback({ success: false, error: {statusCode: err.statusCode, ...err.error}});
                    }
                    else{
                        console.log('SSO login failed: ' + err);
                        return callback({ success: false, error: {statusCode: err.statusCode, ...err}});
                    }
                }
            });
    } catch (err) {
        console.log('SSO login failed: ' + err);
        return callback({success: false, error: {statusCode: 500, code: 500, message: 'publicKey error'}});
    }
}

/**
 * Nuclias Login
 * @param {String} publicKey
 * @param {String} userName
 * @param {String} password
 */
function nucliasLogin(req, res, next) {
    getConnectToken(req.body, (result) => {
        if (result.success) {
            let username = req.body.userName;
            let password = req.body.password;
            //password=util.decrptyMethod(username,password);
            cwmSSOInfo.updateAccount({account: username, password: password}, function (err, data) {
                return res.json(result);
            });
        } else {
            return res.json(result);
        }

    })
}

/**
 * Nuclias questionnaire
 * @param {String} server_site
 * @param {String} email
 * @param {String} access_token
 * @param {String} questName
 * @param {String} questUseFor
 * @param {String} questNumberOfUser
 * @param {String} questNumberOfAp
 * @param {Integer} questNumberOfSite
 */
function nucliasQuest(req, res, next) {
    let access_token = req.body.access_token;
    let quests = req.body.quests;
    let server_site = req.body.server_site;
    let mac_address = [];

    var objs = os.networkInterfaces();
    for (var jk in objs) {
        for (var obj in objs[jk]) {
            if (objs[jk][obj].family == 'IPv4') {
                mac_address.push(objs[jk][obj].mac);
            }
        }
    }

    quests[0].mac_addresses = mac_address;

    let finalQuest = {
        "quests": quests
    };

    const options = {
        method: 'POST',
        uri: 'https://' + server_site + '/' + nuclias_api_prefix + '/auth/Connect/quest',
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: finalQuest,
        rejectUnauthorized: false,
        json: true
    };

    rp(options)
        .then(function (body) {
            console.log('quest success');
            res.json({success: true, data: body});
        })
        .catch(function (err) {
            console.log('quest failure');
            if(err.error&&err.error.error){
                res.json({ success: false, error: err.error.error});
            }
            else if(err.error&&!err.error.error){
                res.json({ success: false, error: err.error});
            }
            else{
                res.json({ success: false, error: err});
            }
        });
}

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * get SSO page info for front-end
 */
function getSSOInfo(req, res, next) {
    let returnValue = {
        enableSSO: false,
        account: '',
        password: '',
        public_ip: '',
        port: '',
    };
    async.series([
        function (next) {
            cwmSSOStatus.getSSOStatus(function (err1, result1) {  // 取得SSO是 enable / disable
                if(err1){
                    next(null,{enableSSO:0});
                }else{
                    next(err1, result1);
                }
            });
        },
        function (next) {
            cwmSSOInfo.getSSOInfo(function (err2, result2) {
                next(err2, result2);
            });
        },
        function (next) {
            cwmOrg.findOrg(function (err3, result3) {
                next(err3, result3);
            })
        }
    ], function (errs, results) {
        if(results[0]){
            returnValue.enableSSO = results[0].enableSSO;
        }
        if(results[2]){
            returnValue.public_ip = (results[2].webAccessAddress || "")+"";
            returnValue.port = (results[2].webAccessPort || "")+"";
        }
        if(results[1]){
            returnValue.account = results[1].account;
            returnValue.password = results[1].password;
            if (!results[1].enable) {
                returnValue.status = results[1].status;
            }
            // if(results[1].public_ip){
            //     returnValue.public_ip = results[1].public_ip + "";
            // }
            // if(results[1].port){
            //     returnValue.port = results[1].port + "";
            // }
        }
        return res.json({success: true, data: returnValue});
    });
}

/**
 * Nuclias enableSSO
 * login 成功之后调用
 * @param {String} access_token
 * @param {String} server_site
 * @param {String} refresh_token
 */
function enableSSO(req, res, next) {
    let reqbody = req.body;
    let user = {
        username: reqbody.userName,
        email: reqbody.userName,
        createDate: new Date(),
        desc: "",
        privilegeStatus: "enabled",
        originalPass: false,
        isNSUser: true,
        role: 'root admin'
    };
    try {
//更新NS 用户到user表
        User.updateNSUser(user, (err, user) => {
            let token = tokenmanager.createTokenForNS(user._id, new Date().getTime(), expiresInSeconds);
            cwmOrg.findOrg(function (err, org) {
                if (!err && org) {
                    const continueHandle = function (){
                        dashboardC.getStateSummary({role: 'root admin'}, org._id, function (dashResult) {
                            if (dashResult.success) {
                                let fwVersion = util.version;
                                firmware.getVersion(function (err, result) {
                                    if(!err && result) {
                                        fwVersion = result.version.replace('v','');
                                    }
                                    let enableSSOObj = {
                                        token: token,
                                        model: util.model,
                                        name: org.name,//util.model + '_' + '1234',// name = model + MAC後四碼(去掉:)，issue: 若有多張網卡，要用哪個MAC待PP決定
                                        version: fwVersion,
                                        statistic: {
                                            "number_of_sites": dashResult.data.siteCount,
                                            "number_of_networks": dashResult.data.networkCount,
                                            "number_of_devices": dashResult.data.apOnline + "/" + dashResult.data.apCount,
                                            "number_of_clients": dashResult.data.clientCount
                                        }    // enableSSO時，可帶可不帶
                                    };
                                    enableSSOObj.organization_id = org.uniqueKey;
                                    enableSSOObj.public_ip = org.webAccessAddress;
                                    enableSSOObj.port = org.webAccessPort.toString();
                                    //enableSSOObj.port = (reqbody.port || org.webAccessPort || "")+"";
                                    //enableSSOObj.public_ip = (reqbody.public_ip || org.webAccessAddress || "")+"";
                                    //enableSSOObj.public_ip = org.devAccessAddress;  // 這個ip可能會變，看看北京有沒有增加webAccessAddress
                                    console.log(enableSSOObj);
                                    const options = {
                                        method: 'POST',
                                        uri: 'https://' + reqbody.server_site + '/' + nuclias_api_prefix + '/auth/Connect/connects',
                                        headers: {
                                            'Authorization': 'Bearer ' + reqbody.access_token,
                                            'Content-Type': 'application/json'
                                        },
                                        body: enableSSOObj,
                                        rejectUnauthorized: false,
                                        json: true
                                    };
                                    rp(options).then(function (body) {
                                        console.log('Enable SSO success');
                                        // 更新SSO狀態,只保存一条
                                        cwmSSOStatus.updateSSOStatus(true, reqbody.modifier, function (err, result) {
                                            console.log("Save SSO status");
                                            systemCli.setSsoLedBySo(1, function (err, result) {
                                                if(err) {
                                                    console.log("Set SSO led error: " + result);
                                                }
                                            });
                                        });

                                        // 新增SSO的修改歷史紀錄
                                        cwmSSOStatusHistory.save({
                                            enableSSO: true,
                                            buildTime: new Date(),
                                            modifier: reqbody.modifier
                                        }, function (err, data) {
                                        });


                                        // 儲存SSO的相關資訊(非狀態)
                                        //// 跟SSO Status一樣只會有一筆資料
                                        delete reqbody.public_ip;
                                        delete reqbody.port;
                                        cwmSSOInfo.updateSSOInfo(reqbody, token, enableSSOObj.organization_id, function (err, data) {
                                        });
                                        // enableSSO後，就要開啟送資料的timer了
                                        timerStart();
                                        return res.json({success: true, data: body});
                                    })
                                        .catch(function (err) {   // 目前API還沒有好，所以處理回傳值先寫在error的地方，以文件上的範例回傳資料來處理邏輯
                                            if(err.error&&err.error.error){
                                                console.log('Enable SSO failed: ' + err.error.error);
                                                return res.json({ success: false, error: {statusCode: err.statusCode, ...err.error.error}});
                                            }
                                            else if(err.error&&!err.error.error){
                                                console.log('Enable SSO failed: ' + err.error);
                                                return res.json({ success: false, error: {statusCode: err.statusCode, ...err.error}});
                                            }
                                            else{
                                                console.log('Enable SSO failed: ' + err);
                                                return res.json({ success: false, error: {statusCode: err.statusCode, ...err}});
                                            }
                                        });
                                });
                            } else {
                                console.log('Read dashboard summary data failed');
                                return res.json({success: false, error: {statusCode: 500, code: 500, message: 'Read dashboard summary data failed'}});
                            }
                        })
                    }

                    if (!org.uniqueKey) {
                        systemCli.getDeviceUUIDBySo(function(uuidErr,uuidResult){
                            if(uuidErr){
                                
                            }else{
                                org.uniqueKey = uuidResult;
                                cwmOrg.updateUniqueKey(org._id, org.uniqueKey, (err, result) => {})
                            }
                            continueHandle()
                        });
                    }else{
                        continueHandle()
                    }
                } else {
                    return res.json({success: false, error: {statusCode: 500, code: 500, message: 'Read org data failed'}});
                }
            });
        });
    } catch (e) {
        console.log("Enable SSO failed: " + e);
        return callback({success: false, error: {statusCode: 500, code: 500, message: 'Enable sso failed'}});
    }
}

/**
 * Nuclias disableSSO
 * @param {String} access_token
 */
function disableSSO(req, res, next) {
    let reqbody = req.body;
    cwmSSOInfo.getSSOInfo(function (err, result) {
        if (result) {
            const options = {
                method: 'DELETE',
                uri: `https://${result.server_site}/${nuclias_api_prefix}/auth/Connect/connects/${result.orgUniqueKey}`,
                headers: {
                    'Authorization': 'Bearer ' + result.access_token,
                    'Content-Type': 'application/json'
                },
                rejectUnauthorized: false,
                json: true
            };
            console.log(options);
            rp(options).then(function (body) {
                console.log('DisableSSO success');
                User.disableNSAccount(result.account, (err, result) => {

                });
                cwmSSOInfo.updateAccountStatus(false, null, (err, result) => {
                });
                // 更新SSO狀態,只保存一条
                cwmSSOStatus.updateSSOStatus(false, reqbody.modifier, function (err, result) {
                    console.log("Save sso status");
                    systemCli.setSsoLedBySo(0, function (err, result) {
                        if(err) {
                            console.log("Set SSO led error: " + result);
                        }
                    });
                });
                // 新增SSO的修改歷史紀錄
                cwmSSOStatusHistory.save({
                    enableSSO: false,
                    buildTime: new Date(),
                    modifier: reqbody.modifier
                }, function (err, data) {
                });

                // enableSSO後，就要開啟送資料的timer了
                timerStop();
                return res.json({success: true, data: body});
            }).catch(function (err) {
                if (err.statusCode == 401) {
                    if(err.error&&err.error.error){
                        console.log('Disable SSO failed: ' + err.error.error);
                        return res.json({ success: false, error: {statusCode: err.statusCode, ...err.error.error}});
                    }
                    else if(err.error&&!err.error.error){
                        console.log('Disable SSO failed: ' + err.error);
                        return res.json({ success: false, error: {statusCode: err.statusCode, ...err.error}});
                    }
                    else{
                        console.log('Disable SSO failed: ' + err);
                        return res.json({ success: false, error: {statusCode: err.statusCode, ...err}});
                    }
                } else if (err.statusCode == 400) {
                    if (err.error&&err.error.error&&err.error.error.code == 1002) {
                        console.debug_log('Disable SSO success');
                        User.disableNSAccount(result.account, (err, result) => {

                        });
                        cwmSSOInfo.updateAccountStatus(false, null, (err, result) => {
                        });
                        cwmSSOStatus.updateSSOStatus(false, reqbody.modifier, function (err, result) {
                            console.debug_log("Save sso status");
                            systemCli.setSsoLedBySo(0, function (err, result) {
                                if(err) {
                                    console.log("Set SSO led error: " + result);
                                }
                            });
                        });
                        cwmSSOStatusHistory.save({
                            enableSSO: false,
                            buildTime: new Date(),
                            modifier: reqbody.modifier
                        }, function (err, data) {
                        });

                        timerStop();
                        return res.json({ success: true, data: err.error.error});
                    } else {
                        if(err.error&&err.error.error){
                            console.log('Disable SSO failed: ' + err.error.error);
                            return res.json({ success: false, error: {statusCode: err.statusCode, ...err.error.error}});
                        }
                        else if(err.error&&!err.error.error){
                            console.log('Disable SSO failed: ' + err.error);
                            return res.json({ success: false, error: {statusCode: err.statusCode, ...err.error}});
                        }
                        else{
                            console.log('Disable SSO failed: ' + err);
                            return res.json({ success: false, error: {statusCode: err.statusCode, ...err}});
                        }
                    }
                }
            })
        } else {
            return res.json({success: false, error: {statusCode: 500, code: 500, message: 'Disable sso failed'}});
        }
    });

}

/**
 * Nuclias statistic
 * WS的timer排程自己做的，不會以前端呼叫，而是在enableSSO後trigger
 */
function statistic(callback) {
    async.series([
        function (cb) {
            cwmSSOStatus.getSSOStatus(cb);
        },
        function (cb) {
            cwmSSOInfo.getSSOInfo(cb);
        },
        function (cb) {
            cwmOrg.findOrg(cb);
        },
        function (cb) {
            firmware.getVersion(cb);
        }
    ], function (errs, results) {
        if (errs) {
            throw errs;
        } else {
            let ssoStatus = results[0];
            let ssoInfo = results[1];
            let orgInfo = results[2];
            let versionInfo = results[3];
            let statisticObj = {statistic: {}};
            if (ssoStatus.enableSSO == true) {   //  才要做statistic
                statisticObj.organization_id = ssoInfo.orgUniqueKey;
                statisticObj.model = util.model;
                statisticObj.name = orgInfo.name;//改用org name util.model + '_' + '1234';     // name = model + MAC後四碼(去掉:)，issue: 若有多張網卡，要用哪個MAC待PP決定
                //statisticObj.public_ip = ssoInfo.public_ip;     // 這個ip可能會變，看看北京有沒有增加webAccessAddress
                //statisticObj.port = ssoInfo.port.toString();
                statisticObj.public_ip = orgInfo.webAccessAddress;
                statisticObj.port = orgInfo.webAccessPort.toString();
                statisticObj.version = versionInfo.version? versionInfo.version.replace('v',''): util.version;
                /** 檢查token過期否 */
                tokenmanager.verifyNSToken(ssoInfo.token, (err, decode) => {
                    if (err) {
                        // 过期，或者token校验失败，重新產生token
                        statisticObj.token = tokenmanager.createTokenForNS(ssoInfo.account, new Date().getTime(), expiresInSeconds);
                        cwmSSOInfo.updateNCToken(ssoInfo._id, statisticObj.token, function (updateErr, updateResult) {
                        });

                    } else {
                        // 未過期,不需要加token
                        // statisticObj.token = ssoInfo.token;
                    }
                    dashboardC.getStateSummary({role: 'root admin'}, orgInfo._id, function (dashResult) {
                        if (!dashResult.success) {
                            console.log('GG simida');
                        } else {
                            statisticObj.statistic.number_of_sites = dashResult.data.siteCount;
                            statisticObj.statistic.number_of_networks = dashResult.data.networkCount;
                            statisticObj.statistic.number_of_devices = dashResult.data.apOnline + "/" + dashResult.data.apCount;
                            statisticObj.statistic.number_of_clients = dashResult.data.clientCount;

                            const options = {
                                method: 'PUT',
                                uri: 'https://' + ssoInfo.server_site + '/' + nuclias_api_prefix + '/auth/Connect/connects/' + statisticObj.organization_id,
                                headers: {
                                    'Authorization': 'Bearer ' + ssoInfo.access_token,
                                    'Content-Type': 'application/json'
                                },
                                body: statisticObj,
                                rejectUnauthorized: false,
                                json: true
                            };
                            console.log(options);
                            /** 送資料了 */
                            rp(options).then(function (body) {
                                console.log('Statistic success');
                                //连线OK了，更新状态
                                cwmSSOInfo.updateAccountStatus(true, null, (err, result) => {
                                    systemCli.setSsoLedBySo(1, function (err, result) {
                                        if(err) {
                                            console.log("Set SSO led error: " + result);
                                        }
                                    });
                                })
                                callback({success: true, data: body});
                            })
                                .catch(function (err) {
                                    console.error_log('Statistic failure');
                                    if (err.statusCode == 400) {
                                        //没有看到从NS做disable的需求，如果可以disable,应该先删掉token
                                        console.error_log('Can not found this org');
                                        cwmSSOInfo.updateAccountStatus(false, "forgot", (err, result) => {
                                        })
                                        // 更新SSO狀態,只保存一条
                                        cwmSSOStatus.updateSSOStatus(false, "system", function (err, result) {
                                            console.debug_log("save sso status, sso disabled by NS");
                                            systemCli.setSsoLedBySo(0, function (err, result) {
                                                if(err) {
                                                    console.log("Set SSO led error: " + result);
                                                }
                                            });
                                        });
                                        // 新增SSO的修改歷史紀錄
                                        cwmSSOStatusHistory.save({
                                            enableSSO: false,
                                            buildTime: new Date(),
                                            modifier: "system"
                                        }, function (err, data) {
                                        });

                                        callback({success: false, error: err});
                                    } else if (err.statusCode == 401) {
                                        console.error_log('Need refresh token');
                                        refreshAccessToken((result) => {
                                            if (result.success) {
                                                options.headers = {
                                                    'Authorization': 'Bearer ' + result.data.access_token,
                                                    'Content-Type': 'application/json'
                                                }
                                                rp(options).then(function (body) {
                                                    console.log('Statistic success');
                                                    callback({success: true, data: body});
                                                }).catch(function (err) {
                                                    console.log('Statistic failure');
                                                    callback({success: false, error: err});

                                                });
                                            } else {
                                                console.log('Refresh token failed callback');
                                                callback({success: false, error: err});
                                            }

                                        })
                                    } else {
                                        let error = 'timeout';
                                        if (err.name == 'RequestError' && err.error.code == 'ETIMEDOUT') {
                                            error = 'timeout';
                                        } else {
                                            if (err.error && err.error.error && err.error.error.code && err.error.error.code == 1010) {
                                                error = 'serverStop';
                                            }
                                        }
                                        cwmSSOStatus.getSSOStatus((err, status) => {
                                            if (status && status.enableSSO) {
                                                cwmSSOInfo.updateAccountStatus(false, error, (err, result) => {
                                                    let ssoMode = (error == 'timeout' ? 2 : 3);
                                                    systemCli.setSsoLedBySo(ssoMode, function (err, result) {
                                                        if(err) {
                                                            console.log("Set SSO led error: " + result);
                                                        }
                                                    });
                                                })
                                            }

                                        });

                                        callback({success: true, data: err});
                                    }

                                });

                        }

                    });
                })

            }

        }
    });

}

/**
 * Nuclias refreshAccessToken
 * @param {String} refresh_token
 */
function refreshAccessToken(callback) {
    cwmSSOInfo.getSSOInfo(function (err, result) {
        if (!err && result) {
            const options = {
                method: 'POST',
                url: `https://${hostname}/oauth/token`,
                headers: {
                    'Authorization': 'Basic ' + nuclias_auth_basic,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                form: {
                    'grant_type': 'refresh_token',
                    'refresh_token': result.refresh_token
                },
                rejectUnauthorized: false,
                json: true
            };
            rp(options)
                .then(function (body) {

                    if (body.error) {
                        console.log('Refresh token error');
                        cwmSSOInfo.updateAccountStatus(false, 'tokenError', (err, result) => {
                            console.log("err:" + err);
                            console.log("result:" + result);
                        })
                        return callback({success: false, error: body.error});
                    } else {
                        console.log('Refresh token success');
                        cwmSSOInfo.updateAccessToken(body, function (err, data) {
                        });
                        return callback({success: true, data: body});
                    }
                })
                .catch(function (err) {
                    User.disableNSAccount(result.account, (err, result) => {

                    });
                    cwmSSOInfo.updateAccountStatus(false, 'tokenError', (err, result) => {
                    });
                    // 更新SSO狀態,只保存一条
                    cwmSSOStatus.updateSSOStatus(false, 'system', function (err, result) {
                        console.log("Save sso status");
                    });
                    // 新增SSO的修改歷史紀錄
                    cwmSSOStatusHistory.save({
                        enableSSO: false,
                        buildTime: new Date(),
                        modifier: 'system'
                    }, function (err, data) {
                    });
                    timerStop();
                    console.log('Refresh token failed');
                    return callback({success: false, error: err});

                });
        } else {
            console.log('Find ssoinfo error or ssoinfo is null');
            return callback({success: false, error: err});
        }
    });
}

/**
 * Nuclias NC Launch
 * @param {String} orgId
 * @param {String} token
 */
function ncLaunch(req, res, next) {
    let orgId = req.body.organization_id;
    let token = req.body.token;
    token = validator.escape(req.body.token);
    let host = req.headers['host'];
    //请求URL
    if (!host) {
        host = util.getSystemAddress().ip;
    }else if(!/^[a-zA-Z0-9:.\-_\u4e00-\u9fa5}]+$/.test(host)){//只允许IPV4 IPV6 域名允许的字符
        return res.send("Error: Host is unlawful");
    }
    let loginUrl = `https://${host}/#!/nucliasLogin?nctoken=${token}`;
    // 未過期
    cwmOrg.findOrg((err, orgInfo) => {
        if (orgInfo) {
            if (orgInfo.uniqueKey == orgId) {
                cwmSSOStatus.getSSOStatus(function (err1, result1) {  // 取得SSO是 enable / disable
                    if (!err1 && result1 && result1.enableSSO) {
                        cwmSSOInfo.getSSOInfo((err, ssoinfo) => {
                            if (ssoinfo && ssoinfo.token == token) {
                                tokenmanager.verifyNSToken(token, (err, decode) => {
                                    if (err) {
                                        // 过期，或者token校验失败，重新產生token
                                        token = tokenmanager.createTokenForNS(ssoinfo.account, new Date().getTime(), expiresInSeconds);
                                        cwmSSOInfo.updateNCToken(orgId, token, function (updateErr, updateResult) {
                                        });
                                        return res.send("Error: token is expired");

                                    } else {
                                        redirect(loginUrl);
                                    }
                                });

                            } else {
                                return res.send("Error: Authentication failed (token)");
                            }
                        });

                    } else {
                        return res.send("Error: SSO is not enabled");
                    }
                });
            } else {
                return res.send("Error: Authentication failed (organization id)");
            }

        } else {
            return res.send("Error: database failed");
        }
    });

    function responseFailed(res, jsondata) {
        res.setHeader('Access-Control-Allow-Origin', '*.nuclias.com');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return res.json(jsondata);
    }


    function redirect(path) {
        var loc = path;
        var msg = 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>\n';

        // redirect
        res.statusCode = 302;
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('Content-Length', Buffer.byteLength(msg));
        res.setHeader('Location', loc);
        res.end(msg);
    }

    function escapeHtml(string) {
        var matchHtmlRegExp = /["'&<>]/;
        var str = '' + string;
        var match = matchHtmlRegExp.exec(str);

        if (!match) {
            return str;
        }

        var escape;
        var html = '';
        var index = 0;
        var lastIndex = 0;

        for (index = match.index; index < str.length; index++) {
            switch (str.charCodeAt(index)) {
                case 34: // "
                    escape = '&quot;';
                    break;
                case 38: // &
                    escape = '&amp;';
                    break;
                case 39: // '
                    escape = '&#39;';
                    break;
                case 60: // <
                    escape = '&lt;';
                    break;
                case 62: // >
                    escape = '&gt;';
                    break;
                default:
                    continue;
            }

            if (lastIndex !== index) {
                html += str.substring(lastIndex, index);
            }

            lastIndex = index + 1;
            html += escape;
        }

        return lastIndex !== index
            ? html + str.substring(lastIndex, index)
            : html;
    }
}

function ncCheck(req, res) {
    let urlPath = req.url.split('?');
    if (urlPath.length >= 2) {
        let qs = querystring.parse(urlPath[1]);
        if (qs.callback && /^[a-zA-Z0-9_\-}]+$/.test(qs.callback)) {
            res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
            let data = {
                "success": true
            };
            data = JSON.stringify(data);
            let callback = qs.callback + '(' + data + ');';
            res.end(callback);
        }
        else {
            res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
            res.end('Invalid Parameter\n');
        }
    } else {
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
        res.end('Invalid Parameter\n');
    }
}

function loginNC(username, password, callback) {
    getNucliasPublicKeyFun((result) => {
        if (result.success) {
            let ssoinfo = {publicKey: result.data.publicKey, userName: username, password: password};
            getConnectToken(ssoinfo, (result1) => {
                return callback(result1);
            })
        } else {
            return callback(result);
        }
    })

}

function getConnectSSO(req, res) {
    cwmSSOInfo.getSSOInfo(function (err, result) {
        if (!err && result) {
            const options = {
                method: 'GET',
                url: ` https://${result.server_site}/${nuclias_api_prefix}/auth/Connect/connects`,
                headers: {
                    'Authorization': 'Bearer ' + result.access_token,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                rejectUnauthorized: false,
                json: true
            };
            rp(options)
                .then(function (body) {
                    console.log('Get connect SSO success');
                    if (body.error) {
                        return res.json({success: false, error: body.error});
                    } else {
                        return res.json({success: true, data: body});
                    }
                })
                .catch(function (err) {
                    // Crawling failed...
                    console.log('Get connect SSO failed');
                    return res.json({success: false, error: err});

                });
        } else {
            console.log('Find ssoinfo error or ssoinfo is null');
            return res.json({success: false, error: err});
        }
    });
}

var statisticTimer;
const time = 5;

function timerStart() {
    if (statisticTimer) {
        console.log('Stop timer first');
        timerStop();
    }
    console.log('Statistic timer start');
    // statisticTimer = setInterval(function () {
    //     console.log('statistic timer start');
    // }, time * 60 * 1000);
    statisticTimer = setInterval(function () {
        console.log('Statistic timer start');
        statistic(function (result) {
            if (!result.success) {
                timerStopForOwn();
            } else {

            }
        });
    }, time * 60 * 1000);
}

function timerStop() {
    console.log('Statistic timer stop');
    clearInterval(statisticTimer);
}

function timerStopForOwn() {
    console.log('Statistic timer stop');
    clearInterval(statisticTimer);
}

function checkSSOStatus() {
    let checkCSTimer = setInterval (function() {
        cwmNCStats.checkCSOnlineStatus((err, result) => { //等待CS启动正常后再进行SSO同步
            if (result) {
                clearInterval(checkCSTimer);
                cwmSSOStatus.getSSOStatus((err, result) => {
                    if (result && result.enableSSO) {
                        statistic(function(result){
                        });
                        timerStart();
                    }
                    else {
                        systemCli.setSsoLedBySo(0, function (err, result) { //SSO disable时，设置led灯橘色闪烁
                            if(err) {
                                console.log("Set SSO led error: " + result);
                            }
                        });
                    }
                })
            }
        })
    }, 5000);
}

module.exports = {
    getNucliasPublicKey,
    nucliasLogin,
    enableSSO,
    disableSSO,
    getSSOInfo,
    refreshAccessToken,
    statistic,
    ncLaunch,
    ncCheck,
    loginNC,
    nucliasQuest,
    getConnectSSO,
    checkSSOStatus,
}