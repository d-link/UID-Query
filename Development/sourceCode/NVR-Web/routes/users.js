//var UserModel = require("../db").User;
'use strict';
const tokenmanager = require("./../lib/tokenManager");
const crypto = require('crypto');
const util = require("../lib/util");
const regCheck = require("../lib/regCheck");
const db = require("../lib/util").db;
const User = db.User;
const LockIp = db.IpLocked;
const EmailCode = db.EmailCode;
const cwmOrg = db.cwmOrg;
const cwmNCStats = db.cwmNCStats;
const cwmSSOStatus = db.cwmSSOStatus;
const mailer = require("../lib/mailer");
const common = require("../lib/util").common;
const systemCli = common.systemCli;
const fs = require('fs');
const os = require('os');
const gridFS = db.cwmFileAPI.gridFS;
var captchapng = require('captchapng');
const validator = require('validator');
const cwmNucliasC = require("../cwmcontroller/nucliasManager");
exports.getCaptcha = function (req, res) {
    var width = !isNaN(parseInt(req.query.width)) ? parseInt(req.query.width) : 100;
    var height = !isNaN(parseInt(req.query.height)) ? parseInt(req.query.height) : 30;
    var code = '0123456789';
    var length = 4;
    var randomcode = '';
    for (var i = 0; i < length; i++) {
        randomcode += code[parseInt(Math.random() * 1000) % code.length];
    }
    // 保存到session
    if (null == req.session['captcha']) {
        req.session['captcha'] = {};
    }
    var code = parseInt(randomcode);
    if (code < 1000) code += 1000;
    req.session['captcha'] = code.toString();

    var p = new captchapng(width, height, code);
    p.color(255, 255, 255, 0);
    p.color(80, 80, 80, 255);
    var img = p.getBase64();
    var imgbase64 = Buffer.from(img, 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'X-Frame-Options': 'SAMEORIGIN',
        'Cache-Control': 'max-age=3600',
    });
    // 'Cache-Control': 'max-age=3600'//只针对验证码这里的cookie失效时间
    res.end(imgbase64);
}
exports.list = function (req, res) {
    let product = req.params.product;
    User.findUsersNotExistOrg(req.body.orgId, function (err, users) {
        if (err) {
            return res.json({success: false, error: err});
        }
        if (users) {
            return res.json({success: true, data: users});
        }
    });
};
exports.changePass = function (req, res, next) {

    let oldPassword = req.body.oldpass;
    let newPassword = req.body.newpass;
    let _id = req.body.userId;

    let opeUserId = _id;
    db.User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin" && opeUser._id != _id) {
                return res.json({success: false, error: -1});
            } else {
                oldPassword = util.decrptyMethod(_id, oldPassword);
                newPassword = util.decrptyMethod(_id, newPassword);
                if(! regCheck.passwordL1(newPassword)){
                    return res.json({success: false, error: "Request parameter validation failed"}); 
                }
                User.findById(_id, function (err, user) {
                    if (err) {
                        return res.json({success: false, error: err});
                    }
                    if (user) {
                        if (encryptPassword(oldPassword) !== user.password) {
                            return res.json({success: false, error: 2});//密码错误
                        } else {
                            if (opeUser.username == "admin" && opeUser.role == "root admin" && os.platform() == "linux") {//DNH-100
                                systemCli.setAdminPasswordBySo([newPassword], function (err, result) {
                                    if (err) {
                                        return res.json({success: false, error: err});
                                    } else {
                                        return res.json({success: true});
                                    }
                                });
                            } else {
                                User.changePass(_id, encryptPassword(newPassword), function (err, result) {
                                    if (err) {
                                        return res.json({success: false, error: err});
                                    } else {
                                        return res.json({success: true});
                                    }
                                });
                            }
                        }
                    }

                })
            }
        }
    });

};
exports.update = function (req, res, next) {
    let data = req.body;
    //按照前端规则过滤传入
    if(!regCheck.username(data.username) 
        || (data.address && !regCheck.address(data.address))
        || (data.phone && !regCheck.phone(data.phone))
        || data._id != req.opeUserId){//阻止修改非本人帐号
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    User.updateBaseInfo(data._id, data, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            User.findById(data._id, function (err, user) {
                if (err) {
                    return res.json({success: false, error: err});
                }
                if (user) {
                    return res.json({success: true, data: user});
                }
            });
        }
    });
};
exports.forgotPass = function (req, res) {
    let email = req.body.email;
    User.findOneUserByEmail(email, function (err, user) {
        if (err) {
            return res.json({success: false, error: err});
        }
        if (user) {
            //生成验证码
            var code = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            var length = 8;
            var captcha = '';
            for (var i = 0; i < length; i++) {
                captcha += code[parseInt(Math.random() * 1000) % code.length];
            }
            cwmOrg.findOrg((err, org) => {
                if (org) {
                    if (org.smtpServer && org.smtpServer.port && org.smtpServer.host) {
                        if (org.smtpServer.auth && org.smtpServer.auth.password) {
                            org.smtpServer.auth.password = util.decrptyMethod(org.smtpServer.auth.username, org.smtpServer.auth.password);
                        }
                        mailer.sendResetPassMail(user.username, email, captcha, org.smtpServer, function (err, result) {
                            if (!err) {
                                EmailCode.saveNewCode({
                                    captcha: captcha,
                                    emailType: common.emailType.resetPass,
                                    email: email,
                                    validDate: 2,
                                    createDate: new Date()
                                }, function (err, data) {

                                });
                                return res.json({success: true, data: user});
                            } else {
                                return res.json({success: false, error: err});
                            }
                        });

                    } else {
                        return res.json({success: false, error: 2});
                    }
                }

            })

        } else {
            return res.json({success: false, error: 1});
        }

    });

};
exports.changeEmail = function (req, res) {

    let opeUserId = req.opeUserId;
    //按照前端规则过滤传入
    if(!regCheck.isEmail(req.body.email)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    db.User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser._id != opeUserId) {
                return res.json({success: false, error: -1});
            } else {
                User.findOneUserByEmail(req.body.email, function (err, user) {
                    if (user) {
                        return res.json({success: false, error: 1});
                    } else {
                        User.changeEmail(req.body.userId, req.body.email, function (err, user) {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else {
                                return res.json({success: true, data: user});
                            }
                        });
                    }

                });
            }
        }
    });

};
exports.usernameExist = function (req, res, next) {
    User.findOneUserByUserName(req.body.username, function (err, user) {
        if (user) {
            return res.json({success: true, data: true});
        } else {
            return res.json({success: true, data: false});
        }

    });
};
exports.emailExist = function (req, res, next) {
    User.findOneUserByEmail(req.body.email, function (err, user) {
        if (user) {
            return res.json({success: true, data: true});
        } else {
            return res.json({success: true, data: false});
        }

    });
};
exports.checkcaptcha = function (req, res) {
    let code = req.body.code;
    let email = req.body.email;
    EmailCode.findByEmail(email, code, common.emailType.resetPass, function (err, data) {
        if (data && data.length == 1) {
            let createDate = new Date(data[0].createDate);
            let validDate = createDate.setHours(createDate.getHours() + data[0].validDate);
            if (validDate < Date.now()) {
                return res.json({success: false, error: 2});//验证码失效，请重新发送
            } else {
                return res.json({success: true, data: true});
            }
        } else {
            return res.json({success: false, error: 1});//验证码不存在
        }
    })
};
exports.changePhoto = function (req, res) {
    User.updatePhoto(req.body.userId, req.files, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            getPhotoFile(result, (err, _user) => {
                if (_user.photo) {
                    return res.json({success: true, data: _user.photo});
                } else {
                    return res.json({success: false, error: 1});
                }
            });
        }
    });
};
exports.resetPass = function (req, res) {
    let email = req.body.email;
    let newpass = req.body.newPassword;
    let code = req.body.code;
    if(! regCheck.passwordL1(newpass)){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    EmailCode.findByEmail(email, code, common.emailType.resetPass, function (err, data) {
        if (data && data.length == 1) {
            let createDate = new Date(data[0].createDate);
            let validDate = createDate.setHours(createDate.getHours() + data[0].validDate);
            if (validDate < Date.now()) {
                return res.json({success: false, error: 2});//验证码失效，请重新发送
            } else {
                User.changePassByEmail(email, encryptPassword(newpass), function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: true});
                    }
                })
            }
        } else {
            return res.json({success: false, error: 1});//验证码不存在
        }
    })
};
exports.getUser = function (req, res, next) {
    // let product=req.params.product;
    User.findById(req.body._id, function (err, user) {
        if (err) {
            return res.json({success: false, error: err});
        }
        if (user) {
            getPhotoFile(user, (err, _user) => {
                return res.json({success: true, data: user});
            });

        } else {
            return res.json({success: false, error: 1});
        }
    })
};
exports.checkBlockIP = function (req, res) {
    let clientIP = getClientIp(req);
    LockIp.checkErrorCount(clientIP, (err, result) => {
        if (result && result.errorCount >= 5) {
            let timespan = 61 - Math.round((new Date().getTime() - new Date(result.lockTime).getTime()) / 1000);
            if (timespan > 60) timespan = 60;
            return res.json({success: false, data: timespan});
        } else {
            return res.json({success: true});
        }
    })
};


exports.getNeedCAPTCHA = function (req, res, next) {
    db.cwmOrg.findAll(function (err, result) {
        if (result && result.length > 0) {
            console.info_log("getNeedCAPTCHA:", result[0].needCAPTCHA);
            return res.json(result[0].needCAPTCHA);
        }
    });
};
let customerDir = `${process.cwd()}/customer`;

function getClientIp(req, proxyType) {
    let ip = req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    // 如果使用了nginx代理
    if (proxyType === 'nginx') {
        // headers上的信息容易被伪造,但是我不care,自有办法过滤,例如'x-nginx-proxy'和'x-real-ip'我在nginx配置里做了一层拦截把他们设置成了'true'和真实ip,所以不用担心被伪造
        // 如果没用代理的话,我直接通过req.connection.remoteAddress获取到的也是真实ip,所以我不care
        ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || ip;
    }
    const ipArr = ip.split(',');
    // 如果使用了nginx代理,如果没配置'x-real-ip'只配置了'x-forwarded-for'为$proxy_add_x_forwarded_for,如果客户端也设置了'x-forwarded-for'进行伪造ip
    // 则req.headers['x-forwarded-for']的格式为ip1,ip2只有最后一个才是真实的ip
    if (proxyType === 'nginx') {
        ip = ipArr[ipArr.length - 1];
    }
    if (ip.indexOf('::ffff:') !== -1) {
        ip = ip.substring(7);
    }
    if (ip.indexOf('::1') !== -1) {
        ip = "127.0.0.1";
    }
    return ip;
}

exports.login = function (req, res, next) {
    let clientIP = getClientIp(req);

    cwmNCStats.checkCSOnlineStatus((err, result) => {
        if (err || !result) {
            return res.json({success: false, error: 510});//CS未运行
        } else {
            let userInfo = req.body.userInfo;
            if (!userInfo) {
                return res.json({success: false, error: '参数错误'});
            }
            let status = req.body.loginStatus;
            let captcha = userInfo.captcha;
            let productMode = req.body.productMode;
            if (captcha && captcha != req.session['captcha']) {
                return res.json({success: false, error: -2});//验证码错误
            }
            let email = userInfo.email;
            let password = userInfo.password;
            const checkPass = function (req, res, user) {

                password = util.decrptyMethod(email, password);

                if (encryptPassword(password) !== user.password) {
                    LockIp.findAndUpdateByIP(clientIP, (err, result) => {
                        if (result && result.errorCount >= 5) {
                            return res.json({success: false, error: 5});
                        } else {
                            return res.json({success: false, error: 2});//密码错误
                        }
                    })
                }
                else {
                    LockIp.removeByClientIP(clientIP, (err, result) => {
                    });
                    if (user.privilegeStatus != "enabled") {
                        return res.json({success: false, error: -3});//账户冻结
                    } else {
                        //修改增加lastUptime取DNH-100的uptime
                        systemCli.getUptimeBySo((err, uptime) => {
                            if (!err) {
                                status.lastUptime = uptime;
                                status.lastLogin = new Date();
                                let token = tokenmanager.createToken(user._id, status.lastUptime);
                                status.token = token;
                                getPhotoFile(user, (err, _user) => {
                                    User.addLoginItem(user._id, status, function (err, result) {
                                        res.setHeader('authorization', 'Bearer ' + token);
                                        return res.json({success: true, data: _user});
                                    });
                                })
                            } else {
                                console.error_log("Get uptime by so api failed: " + err);
                            }
                        });
                        // status.lastLogin = new Date();
                        // let token = tokenmanager.createToken(user._id, status.lastLogin);
                        // status.token = token;
                        // getPhotoFile(user, (err, _user)=> {
                        //     User.addLoginItem(user._id, status, function (err, result) {
                        //         res.setHeader('authorization', 'Bearer ' + token);
                        //         return res.json({success: true, data: _user});
                        //     });
                        // })
                    }
                }
            };
            if (!email || !password) {
                return res.json({success: false, error: 3});//用户名密码不能为空
            }
            User.findOneUserByEmailOrName(email, email, function (err, user) {
                if (err) {
                    return res.json({success: false, error: err});
                } else if (user) {
                    checkPass(req, res, user); //用户名存在，检查密码
                } else {
                    LockIp.findAndUpdateByIP(clientIP, (err, result) => {
                        if (result && result.errorCount >= 5) {
                            return res.json({success: false, error: 5});
                        } else {
                            return res.json({success: false, error: 1});//用户不存在
                        }
                    });
                }
            });
        }
    });


};
exports.logout = function (req, res, next) {
    let token = getToken(req.headers);
    User.updateLogoutStatus(req.body.userId, token, function (err, result) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    })
};

var getToken = function (headers) {
    if (headers && headers.authorization) {
        let authorization = headers.authorization;
        let part = authorization.split(' ');
        if (part.length == 2) {
            return part[1];
        }
        else {
            return null;
        }
    }
    else {
        return null;
    }
};

function getPhotoFile(user, callback) {
    if (user.photo) {
        let uploadDir = customerDir + '/user';
        if (!fs.existsSync(customerDir)) {
            fs.mkdirSync(customerDir);
        }
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        gridFS.getUserFile(user.photo, (err, results) => {
            if (results && results.length > 0) {
                let _temp = results[0];
                let fileName = _temp.filename;
                gridFS.readFileToLocalById(`${uploadDir}/${fileName}`, user.photo, (err) => {
                    user.photo = `/customer/user/${fileName}`;
                    callback(err, user);
                });
            } else {

                callback(err, user);
            }
        })
    } else {

        callback(null, user);
    }
}

exports.updateLastPage = function (req, res) {
    let page = req.body.page;
    let userId = req.body.userId;
    User.updateLastPage(userId, page, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    })
};

exports.updateThreshold = function (req, res) {
    let threshold = req.body.threshold;
    if (!threshold) {
        return res.json({success: false});
    }
    User.updateThreshold(req.opeUserId, threshold, function (err, data) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            return res.json({success: true});
        }
    })
};

function encryptPassword(password) {
    return crypto.createHash("md5").update(password).digest("base64");
}

exports.appCheck = function (req, res, next) {
    let user = req.body.userInfo;
    let tokenSecrete = req.body.tokenSecrete;
    let email = user.email;
    let password = user.password;
    const checkPass = function (req, res, user) {
        if (encryptPassword(password) !== user.password) {
            console.info_log("checkPass: err 2 密码错误");
            return res.json({success: false, error: 2});//密码错误
        }
        else {
            if (user.privilegeStatus != "enabled") {//判断用户是否有效
                console.info_log("privilegeStatus: err 3 账户未激活");
                return res.json({success: false, error: 3});//账户未激活
            } else {
                let token = tokenmanager.createToken(user._id, new Date().getTime());
                res.setHeader("Content-Type", 'application/json');
                //let host = req.headers['host'].split(':');//host[0]:域名或IP; host[1]:端口号;
                let login_host = req.headers['host'];
                let httpType = req.protocol;
                if (req.headers['X-Forwarded-Host']) {
                    //反向代理後 req.headers.host 的問題 
                    login_host = req.headers['X-Forwarded-Host'];
                }
                ;
                //请求URL
                let loginUrl = "";
                if (httpType) {
                    loginUrl = httpType + "://" + login_host + "/#!/appLogin";
                } else {
                    loginUrl = "https://" + login_host + "/#!/appLogin";
                }
                ;
                console.info_log("loginUrl: ", loginUrl);
                //2019.4.17 尹雪雪
                let privilegeTemp = "front desk user";
                if (user.username == "admin") {
                    privilegeTemp = "admin";//"admin" 超级用户能进入App 
                } else {
                    //root user、root user、Local admin、Local user 这四个角色的用户能进入App
                    //"front desk user" 角色的用户不能进入App 
                    privilegeTemp = user.role;
                }
                ;

                let str = JSON.stringify({success: true, loginUrl: loginUrl, token: token, privilege: privilegeTemp});
                console.info_log("login info:", str);
                console.info_log("login success: true");
                return res.send(str);
            }
            ;
        }
    };
    if (!email || !password) {
        console.info_log("check email Pass: err 3 用户名密码不能为空");
        return res.json({success: false, error: 3});//用户名密码不能为空
    }
    ;
    User.findOneUserByEmailOrName(email, email, function (err, user) {
        if (err) {
            console.info_log("findOneUserByEmailOrName success false: ", err);
            return res.json({success: false, error: err});
        }
        if (user) {
            checkPass(req, res, user); //用户名存在，检查密码
        } else {
            console.info_log("findOneUserByEmailOrName success false error 1 用户不存在");
            return res.json({success: false, error: 1}); //用户不存在
        }
    });
};

exports.appLogin = function (req, res, next) {
    let token = validator.escape(req.body.token);
    let status = req.body.loginStatus;
    console.info_log("verifyAppToken: token:", token);
    tokenmanager.verifyAppToken(req, res, (err, user) => {
        if (err) {
            console.info_log("appLogin: err 401");
            return res.sendStatus(401);
        } else {
            if (user.privilegeStatus != "enabled") {
                console.info_log("privilegeStatus: err -3 账户冻结");
                return res.json({success: false, error: -3});//账户冻结
            } else {
                //修改增加lastUptime取DNH-100的uptime
                systemCli.getUptimeBySo((err, uptime) => {
                    if (!err) {
                        console.info_log("appLogin: get DNH-100 uptime:", uptime);
                        status.lastUptime = uptime;
                        status.lastLogin = new Date();
                        status.token = token;
                        User.addLoginItem(user._id, status, function (err, result) {
                            console.info_log("appLogin: run addLoginItem");
                            res.setHeader('authorization', 'Bearer ' + token);
                            console.info_log("appLogin: addLoginItem success true");
                            return res.json({success: true, data: user});
                        });
                    } else {
                        console.error_log("Get uptime by so api failed: " + err);
                        //2019.9.11 尹雪雪
                        return res.json({success: true, data: user});
                    }
                });
                console.info_log("appLogin: verifyAppToken success true");

                // status.lastLogin = new Date();
                // status.token = token;
                // User.addLoginItem(user._id, status, function (err, result) {
                //     res.setHeader('authorization', 'Bearer ' + token);
                //     return res.json({success: true, data: user});
                // });
            }
        }

    });
};
exports.nucliasLogin = function (req, res, next) {
    let token = validator.escape(req.body.token);
    let status = req.body.loginStatus;
    tokenmanager.verifyNucliasToken(req, res, (err, user) => {
        if (err) {
            return res.sendStatus(401);
        } else {
            //修改增加lastUptime取DNH-100的uptime
            systemCli.getUptimeBySo((err, uptime) => {
                if (!err) {
                    status.lastUptime = uptime;
                    status.lastLogin = new Date();
                    status.token = token;
                    User.addLoginItem(user._id, status, function (err, result) {
                        res.setHeader('authorization', 'Bearer ' + token);
                        return res.json({success: true, data: user});
                    });
                } else {
                    console.error_log("Get uptime by so api failed: " + err);
                }
            });
            // status.lastLogin = new Date();
            // status.token = token;
            // User.addLoginItem(user._id, status, function (err, result) {
            //     res.setHeader('authorization', 'Bearer ' + token);
            //     return res.json({success: true, data: user});
            // });
        }

    });
};
exports.loginNC = function (req, res) {
    let clientIP = getClientIp(req);
    //先查询是不是在固件更新
    if (systemCli.getFwUpgradeStatus()) {
        return res.json({success: true, data: 40051});
    } else {
        var p1 = new Promise(function (resolve, reject) {
            cwmNCStats.checkCSOnlineStatus((err, result) => {
                if (err || !result) {
                    resolve({success: false, error: 510});//CS未运行
                } else {
                    let userInfo = req.body.userInfo;
                    if (!userInfo) {
                        resolve({success: false, error: "参数错误"});
                    }
                    let captcha = userInfo.captcha;
                    let productMode = req.body.productMode;
                    if (captcha && captcha != req.session['captcha']) {
                        resolve({success: false, error: -2});//验证码错误
                    }
                    let email = userInfo.email;
                    let password = userInfo.password;
                    if (!email || !password) {
                        resolve({success: false, error: 3});//用户名密码不能为空
                    }
                    resolve({success: true, data: result});
                }
            })
        });
        var p2 = new Promise(function (resolve, reject) {
            let userInfo = req.body.userInfo;
            let email = userInfo.email;
            let password = userInfo.password;
            let status = req.body.loginStatus;
            const loginByNCAccount = function (email, password, res) {
                const checkPass = function (req, res, user) {
                    password = util.decrptyMethod(email, password);
                    if (encryptPassword(password) !== user.password) {
                        LockIp.findAndUpdateByIP(clientIP, (err, result) => {
                            if (result && result.errorCount >= 5) {
                                return res.json({success: false, error: 5});
                            } else {
                                resolve({success: false, error: 2});//密码错误
                            }
                        });
                    }
                    else {
                        LockIp.removeByClientIP(clientIP, (err, result) => {
                        });
                        if (user.privilegeStatus != "enabled") {
                            resolve({success: false, error: -3});//账户冻结
                        } else {
                            //修改增加lastUptime取DNH-100的uptime
                            systemCli.getUptimeBySo((err, uptime) => {
                                if (!err) {
                                    status.lastUptime = uptime;
                                    status.lastLogin = new Date();
                                    let token = tokenmanager.createToken(user._id, status.lastUptime);
                                    status.token = token;
                                    getPhotoFile(user, (err, _user) => {
                                        User.addLoginItem(user._id, status, function (err, result) {
                                            res.setHeader('authorization', 'Bearer ' + token);
                                            resolve({success: true, data: _user});
                                        });
                                    })
                                } else {
                                    console.error_log("Get uptime by so api failed: " + err);
                                }
                            });
                            // status.lastLogin = new Date();
                            // let token = tokenmanager.createToken(user._id, status.lastLogin);
                            // status.token = token;
                            // getPhotoFile(user, (err, _user) => {
                            //     User.addLoginItem(user._id, status, function (err, result) {
                            //         res.setHeader('authorization', 'Bearer ' + token);
                            //         resolve({success: true, data: _user});
                            //     });
                            // })
                        }
                    }
                };
                User.findOneUserByEmailOrName(email, email, function (err, user) {
                    if (err) {
                        resolve({success: false, error: err});
                    } else if (user && !user.isNSUser) {
                        checkPass(req, res, user); //用户名存在，检查密码
                    } else {
                        LockIp.findAndUpdateByIP(clientIP, (err, result) => {
                            if (result && result.errorCount >= 5) {
                                return res.json({success: false, error: 5});
                            } else {
                                resolve({success: false, error: 1});//用户不存在
                            }
                        });
                    }
                });
            };
            cwmSSOStatus.getSSOStatus((err, ssostatus) => {
                if (ssostatus && ssostatus.enableSSO) {
                    User.findNSUser(email, (err, nsuser) => {
                        if (nsuser) {
                            cwmNucliasC.loginNC(email, password, (result) => {
                                if (result.success) {
                                    //修改增加lastUptime取DNH-100的uptime
                                    systemCli.getUptimeBySo((err, uptime) => {
                                        if (!err) {
                                            status.lastUptime = uptime;
                                            status.lastLogin = new Date();
                                            let token = tokenmanager.createToken(nsuser._id, status.lastUptime);
                                            status.token = token;
                                            User.addLoginItem(nsuser._id, status, function (err, result) {
                                                res.setHeader('authorization', 'Bearer ' + token);
                                                resolve({success: true, data: nsuser});
                                            });
                                        } else {
                                            console.error_log("Get uptime by so api failed: " + err);
                                            resolve({success: false, data: err});
                                        }
                                    });
                                    // status.lastLogin = new Date();
                                    // let token = tokenmanager.createToken(nsuser._id, status.lastLogin);
                                    // status.token = token;
                                    // User.addLoginItem(nsuser._id, status, function (err, result) {
                                    //     res.setHeader('authorization', 'Bearer ' + token);
                                    //     resolve({success: true, data: nsuser});
                                    // });
                                } else {
                                    //resolve(result);
                                    loginByNCAccount(email, password, res);
                                }
                            });
                        } else {
                            loginByNCAccount(email, password, res);
                        }
                    })
                } else {
                    loginByNCAccount(email, password, res);
                }
            })
        });
        Promise.all([p1, p2]).then(function (results) {
            if (results && Array.isArray(results) && results.length > 0) {
                for (var i = 0; i < results.length; i++) {
                    if (!results[i]["success"]) {
                        return res.json(results[i]);
                    }
                }
                return res.json(results[1]);
            }
        }).catch(function (err) {
            console.error_log('login error: ', err);
        });
    }

    // cwmNCStats.checkCSOnlineStatus((err, result)=> {
    //     if (err || !result) {
    //         return res.json({success: false, error: 510});//CS未运行
    //     } else {
    //         let userInfo = req.body.userInfo;
    //         if (!userInfo) {
    //             return res.json({success: false, error: "参数错误"});
    //         }
    //         let status = req.body.loginStatus;
    //         let captcha = userInfo.captcha;
    //         let productMode = req.body.productMode;
    //         if (captcha && captcha != req.session['captcha']) {
    //             return res.json({success: false, error: -2});//验证码错误
    //         }
    //         let email = userInfo.email;
    //         let password = userInfo.password;
    //         if (!email || !password) {
    //             return res.json({success: false, error: 3});//用户名密码不能为空
    //         }
    //         const loginByNCAccount = function (email, password, res) {
    //             const checkPass = function (req, res, user) {
    //                 password = util.decrptyMethod(email, password);
    //                 if (encryptPassword(password) !== user.password) {
    //                     return res.json({success: false, error: 2});//密码错误
    //                 }
    //                 else {
    //                     if (user.privilegeStatus != "enabled") {
    //                         return res.json({success: false, error: -3});//账户冻结
    //                     } else {
    //                         status.lastLogin = new Date();
    //                         let token = tokenmanager.createToken(user._id, status.lastLogin);
    //                         status.token = token;
    //                         getPhotoFile(user, (err, _user) => {
    //                             User.addLoginItem(user._id, status, function (err, result) {
    //                                 res.setHeader('authorization', 'Bearer ' + token);
    //                                 return res.json({success: true, data: _user});
    //                             });
    //                         })
    //                     }
    //                 }
    //             }
    //             User.findOneUserByEmailOrName(email, email, function (err, user) {
    //                 if (err) {
    //                     return res.json({success: false, error: err});
    //                 } else if (user && !user.isNSUser) {
    //                     checkPass(req, res, user); //用户名存在，检查密码
    //                 } else {
    //                     return res.json({success: false, error: 1}); //用户不存在
    //                 }
    //             });
    //
    //         }
    //         cwmSSOStatus.getSSOStatus((err, ssostatus) => {
    //             if (ssostatus && ssostatus.enableSSO) {
    //                 User.findNSUser(email, (err, nsuser) => {
    //                     if (nsuser) {
    //                         cwmNucliasC.loginNC(email, password, (result) => {
    //                             if (result.success) {
    //                                 status.lastLogin = new Date();
    //                                 let token = tokenmanager.createToken(nsuser._id, status.lastLogin);
    //                                 status.token = token;
    //                                 User.addLoginItem(nsuser._id, status, function (err, result) {
    //                                     res.setHeader('authorization', 'Bearer ' + token);
    //                                     return res.json({success: true, data: nsuser});
    //                                 });
    //                             } else {
    //                                 return res.json(result);
    //                             }
    //                         });
    //                     } else {
    //                         loginByNCAccount(email, password, res);
    //                     }
    //
    //                 })
    //             } else {
    //                 loginByNCAccount(email, password, res);
    //             }
    //         })
    //
    //     }
    // })
};
exports.appLogout = function (headers, res) {
    let authentication = headers.headers.authorization;//原来属性：authentication
    let space_flag_index = authentication.indexOf(' ');
    let token = authentication.substring(space_flag_index, authentication.length)
        .replace(/(^\s*)|(\s*$)/g, "");
    let req = {};
    req.body = {};
    req.body.token = token;
    if (headers && authentication) {
        tokenmanager.verifyAppToken(req, res, (err, user) => {
            if (err) {
                return res.sendStatus(401);
            } else {
                if (user.privilegeStatus != "enabled") {
                    return res.json({success: false, error: -3});//账户冻结
                } else {
                    //解析出用户ID
                    req.body.userId = user._id;
                    //传入用户ID
                    User.updateLogoutStatus(req.body.userId, token, function (err, result) {
                        if (err) {
                            return res.json({success: false, error: err});
                        } else {
                            return res.json({success: true});
                        }
                    });
                }
            }
        });
    } else {
        return null;
    }

};

