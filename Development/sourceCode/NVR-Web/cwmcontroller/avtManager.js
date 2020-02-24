/**
 * Created by Redd Lin on 2018/11/08.
 */
'use strict';
const env = process.env.NODE_ENV || "development";
const config = require('../config/appconfig.json')[env];    // env == development
const util = require("../lib/util");
const os = require('os');
const async = require('async');
const db = util.db;
const cwmStrav = db.cwmStrav;
const crypto = require('crypto');
const fs = require('fs');
const rp = require('request-promise')
const forge = require('node-forge');
const nuclias_api_prefix = 'api/v1';
const nuclias_auth_basic = 'Q0xDVlhZRktBU1JLUlBBVjphOTNlNmY5NzE4ZDk3YmM5Yzc2YjNkM2ZmNzNlZjNkNA==';
const nuclias_client_secret = 'a93e6f9718d97bc9c76b3d3ff73ef3d4';
let avtObj = require('../lib/avtObj');


const win32Url = process.env["windir"];
// const winUrl = 'C:/Windows/System32/';
const winUrl = win32Url + '/System32/'
const linuxUrl = '/etc/';
const stravName = 'avtInfo';
const key = '9cd5b4cfa1048596';
const iv = 'e6db271db12d4d47';


/**
 * 加密機制
 */
const enLicense = function (str) {
    let cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let crypted = cipher.update(str, 'utf8', 'binary');
    crypted += cipher.final('binary');
    crypted = new Buffer.from(crypted, 'binary').toString('base64');
    return crypted;
}

/**
 * 解密機制
 */
const deLicense = function (str) {
    let crypted = new Buffer.from(str, 'base64').toString('binary');
    let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decoded = decipher.update(crypted, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
}

function createStrav() {
    let json = {
        type: 'trial',
        startDateTime: new Date().toUTCString(),
        currentDateTime: new Date().toUTCString(),
        activator: '',
        activatedTime: '',
        access_token: ''
    }

    var str = JSON.stringify(json);
    return str;
}

Date.prototype.addDays = function (days) {   // 增加天數
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

let checkObjFormat = function (obj) {
    if (!obj.hasOwnProperty('type')) {
        return false;
    }
    if (!obj.hasOwnProperty('startDateTime')) {
        return false;
    }
    if (!obj.hasOwnProperty('currentDateTime')) {
        return false;
    }
    if (!obj.hasOwnProperty('activator')) {
        return false;
    }
    if (!obj.hasOwnProperty('activatedTime')) {
        return false;
    }
    if (!obj.hasOwnProperty('access_token')) {
        return false;
    }

    return true;
}

/**
 * 檢查時間過期與否 
 * 0 : 過期
 * 1 : 未過期
 * 2 : 時間怪異
 */
let checkTime = function (obj) {
    let stravStart = new Date(obj.startDateTime);
    let stravCurrent = new Date(obj.currentDateTime);
    let current = new Date();

    if (current.getTime() < stravCurrent.getTime()) {  // 時間怪異，直接return掉了
        return '2';
    }

    if ((current.getTime() - stravStart.addDays(30).getTime()) > 0) {     // 已過期
        return '0';
    } else {      // 未過期
        return '1';
    }
}

/**
 * 更新activation file & DB
 */
let updateData = function (obj, status, filename, strav) {
    avtObj.avtObj.remind = strav.remind;
    if (status == '0') {
        obj.type = 'expired';
        obj.currentDateTime = new Date().toUTCString();

        let objJsonString = JSON.stringify(obj);
        fs.writeFileSync(filename, enLicense(objJsonString));    // 覆寫activation file
        avtObj.avtObj.info = enLicense(objJsonString);
        if (strav != null) {
            strav.info = enLicense(objJsonString);
            cwmStrav.updateInfo(strav._id, strav.info, function (err) { });
        }

        // 寫個cache或是cookie告訴前端過期了
    } else if (status == '1') {
        obj.currentDateTime = new Date().toUTCString();

        let objJsonString = JSON.stringify(obj);
        fs.writeFileSync(filename, enLicense(objJsonString));    // 覆寫activation file
        avtObj.avtObj.info = enLicense(objJsonString);
        if (strav != null) {
            strav.info = enLicense(objJsonString);
            cwmStrav.updateInfo(strav._id, strav.info, function (err) { });
        }
    } else {    // 時間怪異
        // 不用寫currentDateTime回去，告訴前端有問題
        avtObj.avtObj.info = enLicense(offscreenBuffering);
        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
            if (err) {
                return callback(err);
            }
            if (!strav || strav.length <= 0) {    // DB沒有                      
                let _strav = {};
                _strav.info = enLicense(objJsonString);
                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                    if (err) {
                        console.log('have activation file, no db; create db error');
                        return callback(err);
                    } else {
                        console.log('have activation file, no db; create db');
                        return;
                    }
                });
            }
        });
    }
}

/**
 * 查詢激活物件，給UI用，還是以先抓激活檔的資料為優先，若抓不到激活檔再去DB抓，
 * 前端判斷時間，若是trial的話判斷時間是否正常/怪異，如果remind = true的話，判斷時間是否<=一天
 */
exports.getAvt = function (req, res) {
    let stravInfoObj;

    let stravFile = avtObj.avtObj.info;
    let stravFileEnLicense = deLicense(stravFile);
    stravInfoObj = JSON.parse(stravFileEnLicense);
    stravInfoObj.remind = avtObj.avtObj.remind;

    if (stravInfoObj.type == 'trial') {
        if (new Date().getTime() < new Date(stravInfoObj.currentDateTime).getTime()) {   // 時間怪異
            stravInfoObj.type = 'weird';
        } else if ((new Date().getTime() - new Date(stravInfoObj.startDateTime).addDays(30).getTime()) > 0) {    // 已過期
            stravInfoObj.type == 'expired';
        }
    }

    stravInfoObj.presentTime = new Date().toUTCString();
    

    return res.json({ success: true, data: stravInfoObj });
    
}

/**
 * 查詢激活物件，攔截器用
 */
exports.getAvtInInterceptor = function() {
    let stravInfoObj;

    let stravFile = avtObj.avtObj.info;
    let stravFileEnLicense = deLicense(stravFile);
    stravInfoObj = JSON.parse(stravFileEnLicense);
    stravInfoObj.remind = avtObj.avtObj.remind;

    return stravInfoObj;
}

/**
 * 攔截器檢查完，更新currentDateTime
 */
exports.updateAvtCurrentDateTimeInInterceptor = function() {
    let stravInfoObj;

    let stravFile = avtObj.avtObj.info;
    let stravFileEnLicense = deLicense(stravFile);
    stravInfoObj = JSON.parse(stravFileEnLicense);
    stravInfoObj.currentDateTime = new Date().toUTCString();;

    avtObj.avtObj.info = enLicense(JSON.stringify(stravInfoObj));

}


/**
 * 系統激活
 */
exports.activateStrav = function (req, res) {
    let email = req.body.email;
    let access_token = req.body.access_token;

    let stravInfoObj;
    let isWin = false;
    if (process.platform == 'win32') { // windows
        isWin = true;
    }

    if (isWin) {  // windows
        if (fs.existsSync(winUrl + stravName + '.txt')) {    // 有激活檔
            let stravFile = fs.readFileSync(winUrl + stravName + '.txt', 'utf-8');
            let stravFileEnLicense = deLicense(stravFile);
            stravInfoObj = JSON.parse(stravFileEnLicense);

            stravInfoObj.access_token = access_token;
            stravInfoObj.activator = email;
            stravInfoObj.activatedTime = new Date().toUTCString();
            stravInfoObj.type = 'formal';

            let modifyJsonString = JSON.stringify(stravInfoObj);
            fs.writeFileSync(winUrl + stravName + '.txt', enLicense(modifyJsonString));
        } else {
            return json({ success: false, msg: 'no file' });
        }
    } else {  // linux
        if (fs.existsSync(linuxUrl + stravName + '.txt')) {    // 有激活檔
            let stravFile = fs.readFileSync(linuxUrl + stravName + '.txt', 'utf-8');
            let stravFileEnLicense = deLicense(stravFile);
            stravInfoObj = JSON.parse(stravFileEnLicense);

            stravInfoObj.access_token = access_token;
            stravInfoObj.activator = email;
            stravInfoObj.activatedTime = new Date().toUTCString();
            stravInfoObj.type = 'formal';

            let modifyJsonString = JSON.stringify(stravInfoObj);
            fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(modifyJsonString));
        } else {
            return json({ success: false, msg: 'no file' });
        }
    }

    cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
        if (err) {
            return res.json({ success: false, data: err });
        } else {
            if (strav && strav.length > 0) {   // DB有資料
                console.log('has db so update it');
                strav[0].info = enLicense(JSON.stringify(stravInfoObj));
                cwmStrav.updateInfo(strav[0]._id, strav[0].info, function (err) {
                    if (err) {
                        return res.json({ success: false, msg: 'update db error' });
                    } else {
                        avtObj.avtObj.info = strav[0].info;
                        avtObj.avtObj.remind = strav.remind;
                        return res.json({ success: true, data: stravInfoObj });
                    }

                });
            } else {
                avtObj.avtObj.info = enLicense(JSON.stringify(stravInfoObj));
                return res.json({ success: true, msg: 'no db' });
            }
        }
    });
}

/**
 * 更新remind me last day
 * 只存在DB，所以update db即可
 */
exports.updateRemindMe = function (req, res) {
    cwmStrav.findStrav(function (err, strav) {
        if (err) {
            return res.json({ success: false, data: err });
        } else {
            if (strav && strav.length > 0) {   // DB有資料
                strav[0].remind = true;

                cwmStrav.updateRemind(strav[0]._id, strav[0].remind, function (err) {
                    if (err) {
                        return res.json({ success: false, data: err });
                    } else {
                        avtObj.avtObj.remind = true;
                        return res.json({ success: true, data: 'update remind success' });
                    }
                });
            } else {
                return res.json({ success: false, data: err });
            }
        }
    });
}

/**
 * 產生/檢查/更新 activaion file & DB
 */
exports.checkStrav = function (callback) {

    let isWin = false;
    if (process.platform == 'win32') { // windows
        isWin = true;
    }

    if (isWin) {   // Windows
        if (!fs.existsSync(winUrl + stravName + '.txt')) {    // 沒有激活檔
            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                if (err) {
                    return callback(err);
                }
                if (!strav || strav.length <= 0) {     // DB也沒有，代表應該是第一次使用，create strav以及DB的值
                    var originStravJson = createStrav();

                    fs.writeFileSync(winUrl + stravName + '.txt', enLicense(originStravJson));    // 寫下activation file
                    let _strav = {};
                    _strav.info = enLicense(originStravJson);
                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                        if (err) {
                            console.log('no activation file, no db; create db error');
                            return callback(err);
                        } else {
                            console.log('no activation file, no db; create both');
                            avtObj.avtObj.info = _strav.info;
                            return;
                        }
                    });

                } else {     // DB有，代表strav可能誤刪，所以將DB的值更新後寫回strav並更新DB的值
                    let stravInfoJson = deLicense(strav[0].info);   // 拿出來是JSON string
                    let stravInfoObj = JSON.parse(stravInfoJson);     // 把它變成JSON Object
                    avtObj.avtObj.remind = strav[0].remind;
                    if (stravInfoObj.type == 'trial') {
                        let stravStatus = checkTime(stravInfoObj);

                        updateData(stravInfoObj, stravStatus, winUrl + stravName + '.txt', strav[0]);   // 根據檢查時間的結果，更新狀態、時間...等

                    } else {
                        // formal or expired
                        fs.writeFileSync(winUrl + stravName + '.txt', enLicense(stravInfoJson));    // 寫下activation file
                        avtObj.avtObj.info = enLicense(stravInfoJson);

                        if (stravInfoObj.type == 'formal') {
                            // doSomething, 告知前端已經激活了                            
                            callback('formal');
                            return;
                        } else if (stravInfoObj.type == 'expired') {
                            // doSomething，告知前端已經過期不能試用了                            
                            return;
                        }
                    }

                }
            });
        } else {   // 有激活檔
            let stravFile = fs.readFileSync(winUrl + stravName + '.txt', 'utf-8');
            try {
                let stravFileEnLicense = deLicense(stravFile);
                let stravInfoObj = JSON.parse(stravFileEnLicense);
                if (checkObjFormat(stravInfoObj)) {      // // stravObj的key都正常
                    if (stravInfoObj.type == 'formal') {
                        console.log('cwm has already activated');
                        callback('formal');
                        avtObj.avtObj.info = stravFile;
                        return;
                    }
                    let stravStatus = checkTime(stravInfoObj);
                    if (stravStatus == '0') {
                        stravInfoObj.type = 'expired';
                        stravInfoObj.currentDateTime = new Date().toUTCString();

                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(winUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err, date) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {                           
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                        console.log('update db success, expired..');
                                    }
                                });
                            }
                        });

                        // 寫個cache或是cookie告訴前端過期了
                    } else if (stravStatus == '1') {
                        stravInfoObj.currentDateTime = new Date().toUTCString();
                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(winUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有，直接更新
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        console.log('update db success');
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                    }
                                });
                            }
                        });

                        // 沒過期，可繼續使用
                    } else {
                        // 時間怪異，不用寫currentDateTime回去，告訴前端有問題

                        let objJsonString = JSON.stringify(stravInfoObj);
                        avtObj.avtObj.info = enLicense(objJsonString);
                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        return;
                                    }
                                });
                            }
                        });


                    }
                } else {      // stravObj有key不見了
                    console.log('stravObj key error');
                    async.waterfall([      // DB好像有點慢，所以用waterfall的方式，等到拿到了DB的值再寫回去
                        function (callback) {
                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有  
                                if (err) {
                                    callback(err)
                                } else {
                                    if (strav && strav.length > 0) {    // DB有資料
                                        callback(null, strav[0].info);
                                    }
                                }


                            });

                        }
                    ], function (err, result) {
                        let stravFileEnLicense = deLicense(result);
                        let stravInfoObj = JSON.parse(stravFileEnLicense);
                        fs.writeFileSync(winUrl + stravName + '.txt', result);    // 寫下activation file
                        if (stravInfoObj.type == 'formal') {
                            console.log('cwm has already activated');
                            avtObj.avtObj.info = result;
                            callback('formal');
                            return;
                        }
                        let stravStatus = checkTime(stravInfoObj);
                        if (stravStatus == '0') {
                            stravInfoObj.type = 'expired';
                            stravInfoObj.currentDateTime = new Date().toUTCString();

                            let objJsonString = JSON.stringify(stravInfoObj);
                            fs.writeFileSync(winUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                                if (err) {
                                    return callback(err);
                                }
                                if (!strav || strav.length <= 0) {    // DB沒有                      
                                    let _strav = {};
                                    _strav.info = enLicense(objJsonString);
                                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                        if (err) {
                                            console.log('have activation file, no db; create db error');
                                            return callback(err);
                                        } else {
                                            console.log('have activation file, no db; create db');
                                            avtObj.avtObj.info = _strav.info;
                                            return;
                                        }
                                    });
                                } else {      // DB有
                                    avtObj.avtObj.remind = strav[0].remind;
                                    cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                        if (err) {
                                            console.log('update db err');
                                        } else {
                                            avtObj.avtObj.info - enLicense(objJsonString);
                                            console.log('update db success');
                                        }
                                    });
                                }
                            });

                            // 寫個cache或是cookie告訴前端過期了
                        } else if (stravStatus == '1') {
                            stravInfoObj.currentDateTime = new Date().toUTCString();
                            let objJsonString = JSON.stringify(stravInfoObj);
                            fs.writeFileSync(winUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                                if (err) {
                                    return callback(err);
                                }
                                if (!strav || strav.length <= 0) {    // DB沒有                      
                                    let _strav = {};
                                    _strav.info = enLicense(objJsonString);
                                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                        if (err) {
                                            console.log('have activation file, no db; create db error');
                                            return callback(err);
                                        } else {
                                            console.log('have activation file, no db; create db');
                                            avtObj.avtObj.info = _strav.info;
                                            return;
                                        }
                                    });
                                } else {      // DB有，直接更新
                                    avtObj.avtObj.remind = strav[0].remind;
                                    cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                        if (err) {
                                            console.log('update db err');
                                        } else {
                                            console.log('update db success');
                                            avtObj.avtObj.info = enLicense(objJsonString);
                                        }
                                    });
                                }
                            });

                            // 沒過期，可繼續使用
                        } else {
                            // 時間怪異，不用寫currentDateTime回去，告訴前端有問題

                            let objJsonString = JSON.stringify(stravInfoObj);
                            avtObj.avtObj.info = enLicense(objJsonString);
                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                                if (err) {
                                    return callback(err);
                                }
                                if (!strav || strav.length <= 0) {    // DB沒有                      
                                    let _strav = {};
                                    _strav.info = enLicense(objJsonString);
                                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                        if (err) {
                                            console.log('have activation file, no db; create db error');
                                            return callback(err);
                                        } else {
                                            console.log('have activation file, no db; create db');
                                            return;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }

            } catch (err) {          // // 當deLicense解不出來時，將DB的資料重新寫回file
                console.log('file error');
                async.waterfall([      // DB好像有點慢，所以用waterfall的方式，等到拿到了DB的值再寫回去
                    function (callback) {
                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有  
                            if (err) {
                                callback(err)
                            } else {
                                if (strav && strav.length > 0) {    // DB有資料
                                    callback(null, strav[0].info);
                                }
                            }


                        });

                    }
                ], function (err, result) {
                    let stravFileEnLicense = deLicense(result);
                    let stravInfoObj = JSON.parse(stravFileEnLicense);
                    fs.writeFileSync(winUrl + stravName + '.txt', result);    // 寫下activation file
                    if (stravInfoObj.type == 'formal') {
                        console.log('cwm has already activated');
                        avtObj.avtObj.info = result;
                        callback('formal');
                        return;
                    }
                    let stravStatus = checkTime(stravInfoObj);
                    if (stravStatus == '0') {
                        stravInfoObj.type = 'expired';
                        stravInfoObj.currentDateTime = new Date().toUTCString();

                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(winUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        console.log('update db success');
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                    }
                                });
                            }
                        });

                        // 寫個cache或是cookie告訴前端過期了
                    } else if (stravStatus == '1') {
                        stravInfoObj.currentDateTime = new Date().toUTCString();
                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(winUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有，直接更新
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        console.log('update db success');
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                    }
                                });
                            }
                        });

                        // 沒過期，可繼續使用
                    } else {
                        // 時間怪異，不用寫currentDateTime回去，告訴前端有問題

                        let objJsonString = JSON.stringify(stravInfoObj);
                        avtObj.avtObj.info = enLicense(objJsonString);
                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);                                
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');                                        
                                        return;
                                    }
                                });
                            }
                        });
                    }
                });
            }

        }
    } else {     // 非Windows
        if (!fs.existsSync(linuxUrl + stravName + '.txt')) {    // 沒有激活檔
            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                if (err) {
                    return callback(err);
                }
                if (!strav || strav.length <= 0) {     // DB也沒有，代表應該是第一次使用，create strav以及DB的值
                    var originStravJson = createStrav();

                    fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(originStravJson));    // 寫下activation file
                    let _strav = {};
                    _strav.info = enLicense(originStravJson);
                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                        if (err) {
                            console.log('no activation file, no db; create db error');
                            return callback(err);
                        } else {
                            console.log('no activation file, no db; create both');
                            avtObj.avtObj.info = _strav.info;
                            return;
                        }
                    });

                } else {     // DB有，代表strav可能誤刪，所以將DB的值更新後寫回strav並更新DB的值
                    let stravInfoJson = deLicense(strav[0].info);   // 拿出來是JSON string
                    let stravInfoObj = JSON.parse(stravInfoJson);     // 把它變成JSON Object
                    avtObj.avtObj.remind = strav[0].remind;
                    if (stravInfoObj.type == 'trial') {
                        let stravStatus = checkTime(stravInfoObj);

                        updateData(stravInfoObj, stravStatus, linuxUrl + stravName + '.txt', strav[0]);   // 根據檢查時間的結果，更新狀態、時間...等

                    } else {
                        fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(stravInfoJson));    // 寫下activation file
                        // formal or expired
                        avtObj.avtObj.info = enLicense(objJsonString);
                        if (stravInfoObj.type == 'formal') {
                            callback('formal');
                            // doSomething, 告知前端已經激活了
                            return;
                        } else if (stravInfoObj.type == 'expired') {
                            // doSomething，告知前端已經過期不能試用了
                            return;
                        }
                    }

                }
            });
        } else {   // 有激活檔
            let stravFile = fs.readFileSync(linuxUrl + stravName + '.txt', 'utf-8');
            try {
                let stravFileEnLicense = deLicense(stravFile);

                let stravInfoObj = JSON.parse(stravFileEnLicense);
                if (checkObjFormat(stravInfoObj)) {      // // stravObj的key都正常
                    if (stravInfoObj.type == 'formal') {
                        console.log('cwm has already activated');
                        avtObj.avtObj.info = stravFile;
                        callback('formal');
                        return;
                    }
                    let stravStatus = checkTime(stravInfoObj);
                    if (stravStatus == '0') {
                        stravInfoObj.type = 'expired';
                        stravInfoObj.currentDateTime = new Date().toUTCString();

                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                        console.log('update db success');
                                    }
                                });
                            }
                        });

                        // 寫個cache或是cookie告訴前端過期了
                    } else if (stravStatus == '1') {
                        stravInfoObj.currentDateTime = new Date().toUTCString();
                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有，直接更新
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        console.log('update db success');
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                    }
                                });
                            }
                        });

                        // 沒過期，可繼續使用
                    } else {
                        // 時間怪異，不用寫currentDateTime回去，告訴前端有問題

                        let objJsonString = JSON.stringify(stravInfoObj);
                        avtObj.avtObj.info = enLicense(objJsonString);
                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        return;
                                    }
                                });
                            }
                        });
                    }
                } else {      // stravObj有key不見了
                    console.log('stravObj key error');
                    async.waterfall([      // DB好像有點慢，所以用waterfall的方式，等到拿到了DB的值再寫回去
                        function (callback) {
                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有  
                                if (err) {
                                    callback(err)
                                } else {
                                    if (strav && strav.length > 0) {    // DB有資料
                                        callback(null, strav[0].info);
                                    }
                                }


                            });

                        }
                    ], function (err, result) {
                        let stravFileEnLicense = deLicense(result);
                        let stravInfoObj = JSON.parse(stravFileEnLicense);
                        fs.writeFileSync(linuxUrl + stravName + '.txt', result);    // 寫下activation file
                        if (stravInfoObj.type == 'formal') {
                            console.log('cwm has already activated');
                            avtObj.avtObj.info = result;
                            callback('formal');
                            return;
                        }
                        let stravStatus = checkTime(stravInfoObj);
                        if (stravStatus == '0') {
                            stravInfoObj.type = 'expired';
                            stravInfoObj.currentDateTime = new Date().toUTCString();

                            let objJsonString = JSON.stringify(stravInfoObj);
                            fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                                if (err) {
                                    return callback(err);
                                }
                                if (!strav || strav.length <= 0) {    // DB沒有                      
                                    let _strav = {};
                                    _strav.info = enLicense(objJsonString);
                                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                        if (err) {
                                            console.log('have activation file, no db; create db error');
                                            return callback(err);
                                        } else {
                                            console.log('have activation file, no db; create db');
                                            avtObj.avtObj.info = _strav.info;
                                            return;
                                        }
                                    });
                                } else {      // DB有
                                    avtObj.avtObj.remind = strav[0].remind;
                                    cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                        if (err) {
                                            console.log('update db err');
                                        } else {
                                            console.log('update db success');
                                            avtObj.avtObj.info = enLicense(objJsonString);
                                        }
                                    });
                                }
                            });

                            // 寫個cache或是cookie告訴前端過期了
                        } else if (stravStatus == '1') {
                            stravInfoObj.currentDateTime = new Date().toUTCString();
                            let objJsonString = JSON.stringify(stravInfoObj);
                            fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                                if (err) {
                                    return callback(err);
                                }
                                if (!strav || strav.length <= 0) {    // DB沒有                      
                                    let _strav = {};
                                    _strav.info = enLicense(objJsonString);
                                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                        if (err) {
                                            console.log('have activation file, no db; create db error');
                                            return callback(err);
                                        } else {
                                            console.log('have activation file, no db; create db');
                                            avtObj.avtObj.info = _strav.info;
                                            return;
                                        }
                                    });
                                } else {      // DB有，直接更新
                                    avtObj.avtObj.remind = strav[0].remind;
                                    cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                        if (err) {
                                            console.log('update db err');
                                        } else {
                                            console.log('update db success');
                                            avtObj.avtObj.info = enLicense(objJsonString);
                                        }
                                    });
                                }
                            });

                            // 沒過期，可繼續使用
                        } else {
                            // 時間怪異，不用寫currentDateTime回去，告訴前端有問題

                            let objJsonString = JSON.stringify(stravInfoObj);
                            avtObj.avtObj.info = enLicense(objJsonString);
                            cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                                if (err) {
                                    return callback(err);
                                }
                                if (!strav || strav.length <= 0) {    // DB沒有                      
                                    let _strav = {};
                                    _strav.info = enLicense(objJsonString);
                                    cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                        if (err) {
                                            console.log('have activation file, no db; create db error');
                                            return callback(err);
                                        } else {
                                            console.log('have activation file, no db; create db');
                                            return;
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (err) {          // // 當deLicense解不出來時，將DB的資料重新寫回file
                console.log('file error');
                async.waterfall([      // DB好像有點慢，所以用waterfall的方式，等到拿到了DB的值再寫回去
                    function (callback) {
                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有  
                            if (err) {
                                callback(err)
                            } else {
                                if (strav && strav.length > 0) {    // DB有資料
                                    callback(null, strav[0].info);
                                }
                            }


                        });

                    }
                ], function (err, result) {
                    let stravFileEnLicense = deLicense(result);
                    let stravInfoObj = JSON.parse(stravFileEnLicense);
                    fs.writeFileSync(linuxUrl + stravName + '.txt', result);    // 寫下activation file
                    if (stravInfoObj.type == 'formal') {
                        console.log('cwm has already activated');
                        avtObj.avtObj.info = result;
                        callback('formal');
                        return;
                    }
                    let stravStatus = checkTime(stravInfoObj);
                    if (stravStatus == '0') {
                        stravInfoObj.type = 'expired';
                        stravInfoObj.currentDateTime = new Date().toUTCString();

                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        console.log('update db success');
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                    }
                                });
                            }
                        });

                        // 寫個cache或是cookie告訴前端過期了
                    } else if (stravStatus == '1') {
                        stravInfoObj.currentDateTime = new Date().toUTCString();
                        let objJsonString = JSON.stringify(stravInfoObj);
                        fs.writeFileSync(linuxUrl + stravName + '.txt', enLicense(objJsonString));    // 覆寫activation file

                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        avtObj.avtObj.info = _strav.info;
                                        return;
                                    }
                                });
                            } else {      // DB有，直接更新
                                avtObj.avtObj.remind = strav[0].remind;
                                cwmStrav.updateInfo(strav[0]._id, enLicense(objJsonString), function (err) {
                                    if (err) {
                                        console.log('update db err');
                                    } else {
                                        console.log('update db success');
                                        avtObj.avtObj.info = enLicense(objJsonString);
                                    }
                                });
                            }
                        });

                        // 沒過期，可繼續使用
                    } else {
                        // 時間怪異，不用寫currentDateTime回去，告訴前端有問題

                        let objJsonString = JSON.stringify(stravInfoObj);
                        avtObj.avtObj.info = enLicense(objJsonString);
                        cwmStrav.findStrav(function (err, strav) {   // 去找DB有沒有
                            if (err) {
                                return callback(err);
                            }
                            if (!strav || strav.length <= 0) {    // DB沒有                      
                                let _strav = {};
                                _strav.info = enLicense(objJsonString);
                                cwmStrav.save(_strav, function (err, data) {  // DB新增資料
                                    if (err) {
                                        console.log('have activation file, no db; create db error');
                                        return callback(err);
                                    } else {
                                        console.log('have activation file, no db; create db');
                                        return;
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
    }

}


/**
 * //////////////////////////////Nuclias////////////////////////////////
 */

/**
 * get Nuclias PublicKey
 */
exports.getNucliasPublicKey = function (req, res, next) {
    const options = {
        method: 'GET',
        uri: 'https://register.nuclias.com/oauth/publicKey',
        json: true
    };

    rp(options)
        .then(function (body) {
            res.json({ success: true, data: body.data });
        })
        .catch(function (err) {
            // Crawling failed...
            res.json({ success: false, data: err });
        });

}

/**
 * Nuclias Login
 * @param {String} publicKey
 * @param {String} userName
 * @param {String} password  
 */
exports.nucliasLogin = function (req, res, next) {
    let publicKey = req.body.publicKey;
    let username = req.body.userName;
    let password = req.body.password;

    let key = '-----BEGIN RSA PUBLIC KEY-----';
    key += publicKey;
    key += '-----END RSA PUBLIC KEY-----';
    try {
        let makePublicKey = forge.pki.publicKeyFromPem(key);
        let plaintextPassword = forge.util.encodeUtf8(password);
        let encryptedPassword = forge.util.encode64(makePublicKey.encrypt(plaintextPassword));

        const options = {
            method: 'POST',
            uri: 'https://register.nuclias.com/oauth/token',
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
            json: true
        };

        rp(options)
            .then(function (body) {
                console.log('login success');
                res.json({ success: true, data: body });
            })
            .catch(function (err) {
                // Crawling failed...
                console.log('login failure?');
                // res.json({success: false, data: err});
                if (err.statusCode == 307) {   // 帳號註冊的地方不在option.uri這個位置，所以Nuclias會要求redirect，這邊判斷是不是(statusCode=307)，是的話再帶一次剛剛的登入資料到指定redirect的uri去
                    options.uri = err.response.headers.location;
                    rp(options)
                        .then(function (body2) {
                            console.log('login success');
                            res.json({ success: true, data: body2 });
                        })
                        .catch(function (err2) {
                            console.log('login failure');
                            res.json({ success: false, data: err2 });
                        });
                } else {
                    console.log('login failure : ' + err.statusCode);
                    res.json({ success: false, data: err });
                }
            });
    } catch (err) {
        res.json({ success: false, data: 'publicKey error' });
    }
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
exports.nucliasQuest = function (req, res, next) {
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
    }

    const options = {
        method: 'POST',
        uri: 'https://' + server_site + '/' + nuclias_api_prefix + '/auth/Connect/quest',
        headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: finalQuest,
        json: true
    };

    rp(options)
        .then(function (body) {
            console.log('quest success');
            res.json({ success: true, data: body });
        })
        .catch(function (err) {
            console.log('quest failure');
            res.json({ success: false, data: err });
        });
}