/**
 * Created by lizhimin on 2017/12/8.
 */

'use strict';
const util = require("../lib/util");
const regCheck = require("../lib/regCheck");
const db = util.db;
const User = db.User;
const systemCli = require("../lib/util").common.systemCli;
const crypto = require('crypto');
const os = require('os');

exports.addTeamUser = function (req, res) {
    let opeUserId = req.opeUserId;
    let _user = req.body.teamUser;
    //按照前端规则过滤传入
    if(!regCheck.username(_user.username) 
        //|| !regCheck.passwordL1(_user.password) 
        || (_user.email && !regCheck.isEmail(_user.email))
        || !regCheck.isRole(_user.role)
        || !regCheck.isPrivilegeStatus(_user.privilegeStatus)
        || (_user.address && !regCheck.address(_user.address))
        || (_user.phone && !regCheck.phone(_user.phone))){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                
                _user.password=util.decrptyMethod(_user.username,_user.password);
                if(! regCheck.passwordL1(_user.password)){
                    return res.json({success: false, error: 3}); 
                }
                _user.password = crypto.createHash("md5").update(_user.password).digest("base64");
                _user.email = _user.email;
                _user.originalPass = true;
                _user.createDate = new Date();

                User.findOneUserByUserName(_user.username, function (err, user) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        if (user) {
                            return res.json({success: false, error: 1}); //账号已存在
                        } else {
                            User.findOneUserByEmail(_user.email, function (err, user) {
                                if (err) {
                                    return res.json({success: false, error: err});
                                } else {
                                    if (user) {
                                        return res.json({success: false, error: 2}); //账号已存在
                                    } else {
                                        User.save(_user, function (err, data1) {
                                            if (err) {
                                                return res.json({success: false, error: err});
                                            } else {
                                                return res.json({success: true, data: data1});
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    });
};
exports.delTeamUser = function (req, res) {
    let opeUserId = req.opeUserId;
    User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                let userId = req.body.userId;
                User.findById(userId, function (err, user) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        if (user.username == "admin") {
                            return res.json({success: false, error: "admin"});
                        }
                        User.removeById(userId, function (err, data) {
                            if (err) {
                                return res.json({success: false, error: err});
                            } else {
                                return res.json({success: true, data: data});
                            }
                        });

                    }
                })
            }
        }
    });


    /*User.removeOneUserFromOrg(req.body.userId, req.body.orgId, function (err, data) {
     if (err) {
     return res.json({success: false, error: err});
     }
     else {
     return res.json({success: true, data: data});
     }
     });*/
};
exports.editTeamUser = function (req, res) {
    let opeUserId = req.opeUserId;
    let user = req.body.teamUser;
    //按照前端规则过滤传入
    if(!regCheck.username(user.username) 
        //|| !regCheck.passwordL1(user.password) 
        || (user.email && !regCheck.isEmail(user.email))
        || !regCheck.isRole(user.role)
        || !regCheck.isPrivilegeStatus(user.privilegeStatus)
        || (user.address && !regCheck.address(user.address))
        || (user.phone && !regCheck.phone(user.phone))){
        return res.json({success: false, error: "Request parameter validation failed"}); 
    }
    User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role == "root admin") {
                let password = null;
                if (user.password){
                    password = util.decrptyMethod(user.username,user.password);
                    if(! regCheck.passwordL1(password)){
                        return res.json({success: false, error: 3}); 
                    }
                    user.password = crypto.createHash("md5").update(password).digest("base64");
                }
                User.findOneUserByUserName(user.username, function (err, result) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        if (result && result._id != user._id) {
                            return res.json({success: false, error: 1}); //账号已存在
                        } else {
                            User.findOneUserByEmail(user.email, function (err, result) {
                                if (err) {
                                    return res.json({success: false, error: err});
                                } else {
                                    if (result && result._id != user._id) {
                                        return res.json({success: false, error: 2}); //账号已存在
                                    } else {
                                        if(password && user.username == "admin" && os.platform() == "linux" ){ //DNH-100
                                            systemCli.setAdminPasswordBySo([password], function (err, result){
                                                if(err){
                                                    return res.json({success: false, error: err});
                                                }else{
                                                    delete user.password;  //调用So去设置linux admin密码以及修改db中的password字段
                                                    User.editUser(user, function (err, data1) {
                                                        if (err) {
                                                            return res.json({success: false, error: err});
                                                        } else {
                                                            return res.json({success: true, data: data1});
                                                        }
                                                    })
                                                }
                                            });
                                        }else{
                                            User.editUser(user, function (err, data1) {
                                                if (err) {
                                                    return res.json({success: false, error: err});
                                                } else {
                                                    return res.json({success: true, data: data1});
                                                }
                                            })
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            } else {
                return res.json({success: false, error: -1});
            }
        }
    });
};

exports.privilegeTeamUser = function (req, res) {
    let opeUserId = req.opeUserId;
    User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.role != "root admin") {
                return res.json({success: false, error: -1});
            } else {
                User.modifyUserPrivilege(req.body.networkId, req.body.userIdArr, req.body.tag, function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {
                        return res.json({success: true, data: data});
                    }
                });
            }
        }
    });

};

exports.getAllUser = function (req, res) {
    let opeUserId = req.opeUserId;
    User.findById(opeUserId, function (err, opeUser) {
        if (err) {
            return res.json({success: false, error: err});
        } else {
            if (opeUser.isNSUser) {
                User.findAll(function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {

                        return res.json({success: true, data: data});
                    }
                });
            } else {
                User.findAllDNCUser(function (err, data) {
                    if (err) {
                        return res.json({success: false, error: err});
                    } else {

                        return res.json({success: true, data: data});
                    }
                });
            }}
    });
}