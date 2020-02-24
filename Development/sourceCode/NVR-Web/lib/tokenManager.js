/**
 * Created by lizhimin on 2015/12/15.
 */
'use strict';
const jwt = require("jsonwebtoken");
const util = require("../lib/util");
const systemCli = util.common.systemCli;
const config = util.config;
const db = util.db;
const User = db.User;
const cwmSSOInfo = db.cwmSSOInfo;
const cwmSSOStatus = db.cwmSSOStatus;
const cwmNCStats = db.cwmNCStats;
const crypto = require('crypto');
var decryptTokenFromConfigFile = function () {
    let encrypted = config.jwt_secret;
    let key = "AEFTUOJUKM087";
    const decipher = crypto.createDecipher('aes192', key);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
var getToken = function (headers) {
    if (headers && headers.authorization) {
        let authorization = headers.authorization;
        let part = authorization.split(' ');
        if (part.length == 2) {
            return part[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

Date.prototype.addDays = function (days) {   // 增加天數
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

exports.verifyToken = function (req, res, next) {
    // DNH-100 no activation
    // let obj = avt.getAvtInInterceptor();
    // if (obj.type != 'formal') {
    //     if (obj.type == 'trial') {
    //         if (new Date().getTime() < new Date(obj.currentDateTime).getTime()) {   // 怪異
    //             return res.sendStatus(405);
    //         } else if ((new Date().getTime() - new Date(obj.startDateTime).addDays(30).getTime()) > 0) {    // 過期
    //             return res.sendStatus(405);
    //         } else {
    //             avt.updateAvtCurrentDateTimeInInterceptor();
    //         }
    //     } else {
    //         return res.sendStatus(405);
    //     }        
    // }

    let token = getToken(req.headers);
    jwt.verify(token, decryptTokenFromConfigFile(), function (err, decode) {
        if (err) {
            return res.sendStatus(401);
        }
        User.findById(decode._id, function (err, user) {
            if (err) {
                return res.sendStatus(401);
            } else if (!user) {
                return res.sendStatus(401);
            } else {
                //sso用户，检查是否有效，无效返回1050，提示用户重新登录
                if (user.isNSUser) {
                    cwmSSOStatus.getSSOStatus((err, ssostatus) => {
                        if (ssostatus && ssostatus.enableSSO) {
                            cwmSSOInfo.getSSOInfo((err, result) => {
                                if (result && result.enable) {
                                    let find;
                                    if (user.login) {
                                        find = user.login.find(function (item) {
                                            return item.token == token;
                                        });
                                    }
                                    if (!find) {
                                        return res.sendStatus(401);
                                    } else {
                                        req.opeUserId = decode._id;
                                        User.updateLastLogin(decode._id, token);
                                        next();
                                    }
                                } else {
                                    //与Nuclias通讯的accesstoken失效，需要重新登录
                                    return res.sendStatus(511);
                                }
                            })
                        } else {
                            //被改成disable了，退出登录
                            return res.sendStatus(511);
                        }
                    })
                } else {
                    if (user.privilegeStatus != "enabled") {
                        return res.sendStatus(401);
                    } else {
                        let find;
                        if (user.login) {
                            find = user.login.find(function (item) {
                                return item.token == token;
                            });
                        }
                        if (!find) {
                            return res.sendStatus(401);
                        } else {
                            req.opeUserId = decode._id;
                            User.updateLastLogin(decode._id, token);
                            next();
                        }
                    }
                }

            }
        });
    });
};
exports.verifyAppToken = function (req, res, callback) {
    let token = req.body.token;
    jwt.verify(token, decryptTokenFromConfigFile(), function (err, decode) {
        if (err) {
            return callback(err);
        }
        User.findById(decode._id, function (err, user) {
            if (err) {
                return callback(401);
            } else if (!user) {
                return callback(401);
            } else {
                if (user.privilegeStatus != "enabled") {
                    return callback(401);
                } else {
                    return callback(null, user);
                }
            }
        });
    });
};
exports.createToken = function (userId, time) {
    return jwt.sign({_id: userId, time: time}, decryptTokenFromConfigFile());
};
exports.createTokenForNS = function (userId, time, expiresInMinutes) {
    return jwt.sign({_id: userId, time: time}, decryptTokenFromConfigFile(), {expiresIn: expiresInMinutes});
}
exports.verifyNSToken = function (token, callback) {
    //验证是token是否有效，是否过期
    jwt.verify(token, decryptTokenFromConfigFile(), function (err, decode) {
        return callback(err, decode);
    });
}
exports.verifyNucliasToken = function (req, res, callback) {
    let token = req.body.token;
    jwt.verify(token, decryptTokenFromConfigFile(), function (err, decode) {
        if (err) {
            return callback(err);
        }
        cwmSSOInfo.getSSOInfoByToken(token, function (err, result) {
            if (result) {
                User.findById(decode._id, function (err, user) {
                    if (err) {
                        return callback(401);
                    } else if (!user) {
                        return callback(401);
                    }
                    else {
                        if (user.username == result.account) {
                            return callback(null, user);
                        } else {
                            return callback(401);
                        }

                    }
                });

            } else {
                return callback('User is not found');
            }
        })

    });
};
exports.refreshUserStatus = function () {
    User.findAll(function (err, users) {
        if (!users || users.length <= 0) return;
        systemCli.getUptimeBySo(function (err, uptime) {
            if (!err) {
                for (let j = 0; j < users.length; j++) {
                    let user = users[j];
                    if (user.login) {
                        for (let i = 0; i < user.login.length; i++) {
                            //修改增加lastUptime取DNH-100的uptime
                            if (user.login[i].token && user.login[i].lastUptime &&
                                (uptime - user.login[i].lastUptime > 15 * 60)) {
                                User.updateLogoutStatus(user._id, user.login[i].token);
                            }
                        }
                    }
                }
            }
        });
    });
};

exports.refreshWSStatus = function () {
    cwmNCStats.updateWSLastOnlineTime(function (err, result) {
        if (err) {
            console.error_log('Refresh WS online time error: ' + err);
        }
    });
};
