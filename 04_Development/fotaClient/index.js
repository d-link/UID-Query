const assert = require('assert');
const https = require('https');
const axios = require('axios');
const httpsAgent = new https.Agent({
  keepAlive: true,
});
// const axiosRetry = require("axios-retry");
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const crypto = require('crypto')
const async = require('async');
const forge = require('node-forge')
const ora = require('ora');

const systemCli = require('./systemCli');
const console = require('./console');
const db = require('./db');

// console.light('light', process.argv)
// console.log('info', process.argv)
// console.warn('warn', process.argv)
// console.error('error', process.argv)


//规范MAC格式
function macCompliance(mac) {
  return mac.replace(/-/g, ':').toUpperCase()
}

//配置文件路径
const cfgPath = '/oem/nc1/config';
fse.ensureDirSync(cfgPath);

const baseCfg = path.join(cfgPath, 'fota.json');
//FOTA Account文件[加密]
// const fotaAccPath = path.join(cfgPath, 'fota.acc');
//firmware 保存路径
const fwPath = '/userdata/fwTmp';

//axios默认配置
axios.defaults.headers.post['Content-Type'] = 'application/json; charset=utf-8';
// axiosRetry(axios, {
//   retries: 2,
//   retryDelay: (retryCount) => {
//     return retryCount * 1000;
//   },
// });
//设置全局的请求次数,请求的间隙,超时时间
// axios.defaults.retry = 2;
// axios.defaults.retryDelay = 3 * 1000;
// axios.defaults.timeout = 20 * 1000;
// axios.interceptors.response.use(undefined, function axiosRetryInterceptor(err) {
//     var config = err.config;
//     // If config does not exist or the retry option is not set, reject
//     if(!config || !config.retry) return Promise.reject(err);
    
//     // Set the variable for keeping track of the retry count
//     config.__retryCount = config.__retryCount || 0;
    
//     // Check if we've maxed out the total number of retries
//     if(config.__retryCount >= config.retry) {
//         // Reject with the error
//         return Promise.reject(err);
//     }
    
//     // Increase the retry count
//     config.__retryCount += 1;
    
//     // Create new promise to handle exponential backoff
//     var backoff = new Promise(function(resolve) {
//         setTimeout(function() {
//             resolve();
//         }, config.retryDelay || 1);
//     });
    
//     // Return the promise in which recalls axios to retry the request
//     return backoff.then(function() {
//         return axios(config);
//     });
// });

//done 需要根据实际环境生成
//axios.defaults.headers.post['User-Agent'] = 'DNH-DNH-200-Ax-Default/1.01.01';
// 封装HTTP请求结果为Promise形式
function httpRequest(options) {
  // console.log('option:',JSON.stringify(options));
  return new Promise((resolve, reject) => {
    axios(options)
      .then((res) => {
        resolve(res.data);
      })
      .catch(function (error) {
        reject(error);
      });
  });
}

//获取fota客户端did等信息
function getFotaClientData() {
  return new Promise((resolve, reject) => {
    systemCli.getFotaClientDataBySo((err, info) => {
      if (err) {
        reject(err)
      } else {
        resolve(info)
      }
    })
  })
}
//获取设备名称
function getDeviceName() {
  return new Promise((resolve, reject) => {
    systemCli.getDeviceNameBySo((err, info) => {
      if (err) {
        reject(err)
      } else {
        resolve(info)
      }
    })
  })
}
//获取fota配置
function getFOTASetting() {
  return new Promise((resolve, reject) => {
    fs.readFile(baseCfg, 'utf8', (err, data) => {
      if (err) {
        //如果取不到，尝试从/oem/nc2/config读取
        fs.readFile(baseCfg.replace(/1/gi, "2"), "utf8", (err, data) => {
          if (err) {
            reject(err);
          } else {
            try {
              let setting = JSON.parse(data);
              resolve(setting);
            } catch (ex) {
              reject(ex);
            }
          }
        });
      } else {
        try {
          let setting = JSON.parse(data);
          resolve(setting);
        } catch (ex) {
          reject(ex);
        }
      }
    });
  })
}
//获取fota的日程配置
function getFOTASchedule(){
  return new Promise((resolve,reject)=>{
    systemCli.getFOTASettingBySo((err,data)=>{
      if(err){
        reject(err);
      }else{
        resolve(data);
      }
    })
  })
}

//尝试加密内容
function encrypt(data, key) {
  return new Promise((resolve, reject) => {
    try {
      // console.log('加密key：', data, key);

      var iv = forge.random.getBytesSync(16);
      var cipher = forge.cipher.createCipher('AES-ECB', key);
      cipher.start({
        iv: iv
      });
      cipher.update(forge.util.createBuffer(data));
      var result = cipher.finish();
      var encrypted = cipher.output;
      // outputs encrypted hex
      // console.log('加密结果:', result);
      if (result) {
        // console.log('encrypt:', encrypted.toHex());
        // outputs encrypted hex
        resolve(encrypted.toHex());
      } else {
        reject('encryption failed');
      }
    } catch (ex) {
      console.error(ex)
      reject(ex)
    }
  })

}

//尝试解密内容
function decrypt(data, key) {
  return new Promise((resolve, reject) => {
    try {
      // console.log('解密key：', data, key);
      var iv = forge.random.getBytesSync(16);
      var decipher = forge.cipher.createDecipher('AES-ECB', key);
      decipher.start({
        iv: iv
      });
      let encrypted = forge.util.hexToBytes(data);
      // decipher.update(encrypted);
      decipher.update(forge.util.createBuffer(encrypted));
      var result = decipher.finish(); // check 'result' for true/false
      // outputs decrypted hex
      // console.log('解密结果：', result);
      if (result) {
        // console.log('decrypt:', decipher.output.toString());

        //return decipher.output.toString()
        resolve(decipher.output.toString());
      } else {
        //清除原有异常密文
        db.removeSecret()
          .then((d) => {})
          .catch((ex) => {});
        reject("decryption failed");
      }
    } catch (ex) {
      console.error(ex)
      reject(ex)
    }
  })
}

//读加密文件
function readEncryptFile(data, key, filePath) {

}

//写加密文件
function writeEncryptFile(orginalData, key, filePath) {
  return new Promise((resolve, reject) => {
    encrypt(orginalData, key).then(data => {
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          reject(err)
        } else {
          // console.log('加密文件已被保存');
          resolve(true)
        }
      });
    }).catch(ex => {
      // console.log('加密文件保存异常', ex);
      reject(ex)
    })
  })
}

/*
获取设备信息
*/
function getDevInfo() {
  return new Promise((resolve, reject) => {
    systemCli.getSystemAboutBySo((err, info) => {
      if (err) {
        if (err == 40001) {
          //windows模拟数据
          info = {
            fwVersion: '1.0.0.0_0924',
            macAddress: '3a:32:a0:22:a3:d9',
            time: '2020-10-09 06:21:02',
            timezone: '(GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London',
            sysUsage: '13.9G / 1.1G',
            sdUsage: 'n/a',
            usbUsage: 'n/a',
            hwVersion: 'A123',
            NTPStatus: 1
          }
          if (info && info.fwVersion) {
            let fv = info.fwVersion.split('.');
            // delete info.fwVersion;
            info.fwVersion = fv;
          }
          if (info && info.hwVersion) {
            let hv = info.hwVersion.replace(/(\d){1,}/g, 'x');
            // delete info.hwVersion;
            info.hwVersion = hv;
          }
          resolve(info);
        } else {
          reject(err);
        }
      } else {
        if (info && info.fwVersion) {
          let fv = info.fwVersion.split('.');
          // delete info.fwVersion;
          info.fwVersion = fv;
        }
        if (info && info.hwVersion) {
          let hv = info.hwVersion.replace(/(\d){1,}/g, 'x');
          // delete info.hwVersion;
          info.hwVersion = hv;
        }
        resolve(info);
      }
    })
  })
}

//统一设置upgrade状态
function setUpgradeStatus(value){
  return new Promise((resolve,reject)=>{
    async.waterfall(
      [
        //1.设置FOTA更新状态:busy
        (cb) => {
          systemCli.setFOTAUpdateStatusBySo(value, (err, result) => {
            if (err) {
              cb(err, null);
            } else {
              cb(null, true);
            }
          });
        },
        //2.设置固件更新状态：running
        // (set, cb) => {
        //   systemCli.setFirmwareUpgradeStatusBySo(value, (err, result) => {
        //     if (err) {
        //       cb(err, null);
        //     } else {
        //       cb(null, true);
        //     }
        //   });
        // },
      ],
      (err, setResult) => {
        if(err){
          reject(err);
        }else{
          resolve(setResult);
        }
      }
    );
  })
}

/*
获取板子当前时刻，用于与服务端时间对比
*/
function getCurrentTime() {
  return (new Date()).getTime();
}

/*
获取数据库中的Fota Account
*/
function getFotaAccount() {
  return new Promise((resolve, reject) => {
    db.getSecret().then(data=>{
      resolve(data);
    }).catch(ex=>{
      reject(ex);
    })
    // fse.pathExists(fotaAccPath).then(exists => {
    //   if (exists) {
    //     fs.readFile(fotaAccPath, (err, data) => {
    //       if (err) {
    //         reject(err)
    //       } else {
    //         resolve(data)
    //       }
    //     })
    //   } else {
    //     resolve(exists)
    //   }
    // }).catch(ex => reject(ex)) // => false
  })
}

/*
注册流程
*/
async function devRegister(callback) {
  try {
    //获取设备信息
    let devInfo = await getDevInfo()
    let macAdd = devInfo.macAddress.toUpperCase();
    //密文
    let acc = await getFotaAccount();    
    let key = macAdd.replace(/:/gi, '') + 'ABCD';
    //获取FOTA配置文件
    let setting = await getFOTASetting();
    //User-Agent format: DNH-DNH-200-Ax-Default/1.01.01
    let agentStr = `${setting.series}-${setting.model}-${setting.hwVersion}-${setting.variant}/${devInfo.fwVersion[0]}.${devInfo.fwVersion[1]}.${devInfo.fwVersion[2]}`
    // console.log('agentStr:', agentStr);
    
    //检查是否存在Account
    if (acc) {
      //读取
      // console.log('密文：', acc.toString());
      //解密
      let dec = await decrypt(acc.toString(), key)
      // console.log('明文', dec);
      let content = JSON.parse(dec)
      //是否存在refreshToken
      if (content && content.macAddress && content.macAddress == macAdd && content.hasOwnProperty('refreshToken')) {
        //存在
        callback(null, content);
      } else {
        //不存在refreshToken,重新注册
        console.warn('refresh token does not exist');

        let fotaUserInfo = await getFotaClientData();
        // console.log('fotaUserInfo', fotaUserInfo)
        let option_register = {
          method: 'post',
          headers: {
            'User-Agent': agentStr
          },
          url: setting.endpoint + '/oauth2/v1/token',
          data: {
            "client_id": fotaUserInfo.clientId,
            "client_secret": "",
            "grant_type": "device",
            "username": macAdd,
            "password": fotaUserInfo.did
          },
          httpsAgent: httpsAgent
        }

        // console.log(option_register);
        /**/
        console.log('process: devRegister')
        httpRequest(option_register).then(resp => {
          // console.log('register response: ',  resp)

          if (resp && resp.refresh_token) {
            let orgin = {
              macAddress: macAdd,
              refreshToken: resp.refresh_token,
              accessToken: resp.access_token,
            };
            //写加密文件
            /*
            writeEncryptFile(JSON.stringify(orgin), key, fotaAccPath).then(writeResult => {
              if (writeResult) {
                //console.log('writeResult', writeResult);

                devInfoUpdate((err, updateResult) => {});
                //只要加密文件保存成功，不管更新是否成功就返回
                callback(null, orgin);
              } else {
                callback('failed to save ciphertext', null);
              }
            })
            */
            //加密后写数据库
            encrypt(JSON.stringify(orgin), key)
              .then((cipher) => {
                db.writeSecret(cipher).then((writeResult) => {
                  if (writeResult) {
                    // update Device
                    devInfoUpdate((err, updateResult) => {});
                    //只要加密内容保存成功，不管更新是否成功就返回
                    callback(null, orgin);
                  } else {
                    callback("failed to save ciphertext", null);
                  }
                });
              })
              .catch((ex) => {
                callback(ex.message,null);
              });
          } else {
            //注册失败
            //throw 'registration failure'
            callback('registration failure', null);
          }
        })
          .catch(err => {
            console.error(`register error: ${err.message}`)
            callback(err.message, null);
          });
      }
    } else {
      console.warn('FOTA account information does not exist');

      let fotaUserInfo = await getFotaClientData();
      // console.log('fotaUserInfo', JSON.stringify(fotaUserInfo))
      let option_register = {
        method: 'post',
        headers: {
          'User-Agent': agentStr
        },
        url: setting.endpoint + '/oauth2/v1/token',
        data: {
          "client_id": fotaUserInfo.clientId,
          "client_secret": "",
          "grant_type": "device",
          "username": macAdd,
          "password": fotaUserInfo.did
        },
        httpsAgent: httpsAgent
      }

      // console.log(option_register);
      console.log('process: devRegister')
      httpRequest(option_register).then(resp => {

        if (resp && resp.refresh_token) {
          let orgin = {
            macAddress: macAdd,
            refreshToken: resp.refresh_token,
            accessToken: resp.access_token,
          };
          //加密后写数据库
          encrypt(JSON.stringify(orgin), key)
            .then((cipher) => {
              db.writeSecret(cipher).then((writeResult) => {
                if (writeResult) {
                  // update Device
                  devInfoUpdate((err, updateResult) => {});
                  //只要加密内容保存成功，不管更新是否成功就返回
                  callback(null, orgin);
                } else {
                  callback("failed to save ciphertext", null);
                }
              });
            })
            .catch((ex) => {
              callback(ex, null);
            });
        } else {
          //注册失败
          // throw 'registration failure'
          callback('registration failure', null);
        }

      })
        .catch(err => {
          // err.forEach(function(e) {
          //   console.error(`register error: ${e.message}\n`, e.response.data)
          // });
          console.error(`register error: ${err.message}`)
          callback(err.message, null);
        });
    }
  } catch (ex) {
    console.error("device registration exception:", ex);
    callback(ex, null)
  }
}

/*
设备更新
*/
async function devInfoUpdate (callback) { 
    try {
      //获取设备信息
      let devInfo = await getDevInfo();
      let macAdd = devInfo.macAddress.toUpperCase();
      //密文
      let acc = await getFotaAccount();
      let key = macAdd.replace(/:/gi, "") + "ABCD";
      //获取FOTA配置文件
      let setting = await getFOTASetting();
      //User-Agent format: DNH-DNH-200-Ax-Default/1.01.01
      let agentStr = `${setting.series}-${setting.model}-${setting.hwVersion}-${setting.variant}/${devInfo.fwVersion[0]}.${devInfo.fwVersion[1]}.${devInfo.fwVersion[2]}`;
      // console.log('agentStr:', agentStr);

      //检查是否存在Account文件
      if (acc) {
        //读取
        // console.log('密文：', acc.toString());
        //解密
        let dec = await decrypt(acc.toString(), key);
        // console.log('明文', dec);
        let content = JSON.parse(dec);
        //是否存在refreshToken
        if (content && content.macAddress && content.macAddress == macAdd && content.hasOwnProperty("refreshToken")) {
          //获取最新access token

          // update Device option
          let option_updateDev = {
            method: "patch",
            headers: {
              "User-Agent": agentStr,
              authorization: "Bearer " + content.accessToken,
            },
            url: setting.endpoint + "/device/v1/me",
            data: {
              fw_variant: setting.variant,
              fw_ver: {
                major: devInfo.fwVersion[0],
                minor: devInfo.fwVersion[1],
                rev: devInfo.fwVersion[2],
              },
            },
            httpsAgent: httpsAgent,
          };
          // update Device
          console.log("process: update Device");
          httpRequest(option_updateDev)
            .then((up) => {
              // console.log('update: ', up)
              callback(null, true);
            })
            .catch((err) => {
              // console.error(`update Device error: ${err.message}`);
              // callback(err.message, null);
              // http status code:401, error_code:111 时需要刷新access token
              if (err.response && err.response.status && err.response.status == 401) {
                if (err.response.data && err.response.data.error_code && err.response.data.error_code == 111) {
                  console.warn("token expired");
                  //重新注册
                  refreshAccessToken((err, info) => {
                    if (err) {
                      callback(err, null);
                    } else {
                      console.warn("redo");
                      devInfoUpdate(callback);
                    }
                  });
                } else {
                  callback(err.message, null);
                }
              } else {
                callback(err.message, null);
              }
            });
        } else {
          //不存在refreshToken
          console.warn("decryption failed or there is no refreshtoken");

          //需要重新注册
          callback(null, null);
        }
      } else {
        //没有注册过，需要完成注册流程后再执行
        callback(null, null);
      }
    } catch (ex) {
      console.error("update Device exception:", ex);
      callback(ex, null);
    }

}

/*
刷新access token
*/
async function refreshAccessToken(callback) {
  try {
    //获取设备信息
    let devInfo = await getDevInfo();
    let macAdd = devInfo.macAddress.toUpperCase();
    //密文
    let acc = await getFotaAccount();    
    let key = macAdd.replace(/:/gi, '') + 'ABCD';
    //获取FOTA配置文件
    let setting = await getFOTASetting();
    //User-Agent format: DNH-DNH-200-Ax-Default/1.01.01
    let agentStr = `${setting.series}-${setting.model}-${setting.hwVersion}-${setting.variant}/${devInfo.fwVersion[0]}.${devInfo.fwVersion[1]}.${devInfo.fwVersion[2]}`
    // console.log('agentStr:', agentStr);
    
    //检查是否存在Account文件
    if (acc) {
      //读取
      // console.log('密文：', acc.toString());
      //解密
      let dec = await decrypt(acc.toString(), key)
      // console.log('明文', dec);
      let content = JSON.parse(dec);

      // console.warn('content:',JSON.stringify(content))
      //是否存在refreshToken
      if (content && content.macAddress && content.macAddress == macAdd && content.hasOwnProperty('refreshToken')) {
          //刷新一下token
          let fotaUserInfo = await getFotaClientData();

          let refesh_option = {
            method: "post",
            headers: {
              "User-Agent": agentStr,
            },
            url: setting.endpoint + "/oauth2/v1/token",
            data: {
              client_id: fotaUserInfo.clientId,
              client_secret: "",
              grant_type: "refresh_token",
              refresh_token: content.refreshToken,
            },
            httpsAgent: httpsAgent,
          };

          console.log("process: refresh token");
          /**/
          httpRequest(refesh_option)
            .then((resp) => {
              // console.log('refresh token response',JSON.stringify(resp))
              if (resp && resp.access_token) {
                let orgin = Object.assign(content, {
                  accessToken: resp.access_token,
                }); //属性合并

                //加密后写数据库
                encrypt(JSON.stringify(orgin), key)
                  .then((cipher) => {
                    db.writeSecret(cipher).then((writeResult) => {
                      if (writeResult) {
                        callback(null, orgin);
                      } else {
                        callback("failed to save ciphertext", null);
                      }
                    });
                  })
                  .catch((ex) => {
                    callback(ex, null);
                  });
              } else {
                //token 刷新失败
                //throw 'refresh token failure'
                callback("refresh token failure", null);
              }
            })
            .catch((err) => {
              // console.error(`refreshToken error: ${err.message}`);
              // http status code:400, error_code:101 时需要立即重新注册
              if (err.response && err.response.status && err.response.status == 400) {
                if (err.response.data && err.response.data.error_code && err.response.data.error_code == 101) {
                  console.warn("the device needs to be re registered");
                  //重新注册
                  devRegister((err, info) => {
                    callback(err, info);
                  });
                } else {
                  callback(err.message, null);
                }
              } else {
                callback(err.message, null);
              }
            });
      } else {
        //不存在refreshToken
        console.warn('decryption failed or there is no refreshtoken');
        //缺少关键信息，需要重新注册
        devRegister((err, info) => {
          callback(err, info);
        })
      }
    } else {
      //没有注册过，需要完成注册流程后再执行
      devRegister((err, info) => {
        callback(err, info);
      })
    }
  } catch (ex) {
    console.error("refresh token exception:", ex);
    callback(ex.message, null);
  }
}

/*
查询最新固件信息
*/
async function queryFwFromFota(callback) {
  try {
    //获取设备信息
    let devInfo = await getDevInfo();
    let macAdd = devInfo.macAddress.toUpperCase();
    //密文
    let acc = await getFotaAccount();    
    let key = macAdd.replace(/:/gi, '') + 'ABCD';
    //获取FOTA配置文件
    let setting = await getFOTASetting();
    //User-Agent format: DNH-DNH-200-Ax-Default/1.01.01
    let agentStr = `${setting.series}-${setting.model}-${setting.hwVersion}-${setting.variant}/${devInfo.fwVersion[0]}.${devInfo.fwVersion[1]}.${devInfo.fwVersion[2]}`
    // console.log('agentStr:', agentStr);
    
    //检查是否存在Account文件
    if (acc) {
      //读取
      // console.log('密文：', acc.toString());
      //解密
      let dec = await decrypt(acc.toString(), key)
      // console.log('明文', dec);
      let content = JSON.parse(dec);
      //是否存在refreshToken
      if (content && content.macAddress && content.macAddress == macAdd &&
        content.hasOwnProperty('refreshToken')) {
          //存在
          //console.log('content : ', content);

          //获取最新的firmware信息
          let query_option = {
            method: "get",
            // retry: 2,
            // retryDelay: 3 * 1000,
            // timeout: 20 * 1000,
            headers: {
              "User-Agent": agentStr,
              authorization: "Bearer " + content.accessToken,
            },
            url: setting.endpoint + "/device/v1/me/latest_fw",
            httpsAgent: httpsAgent,
          };
          console.log("process: query firmware from FOTA");
          httpRequest(query_option)
            .then((fw) => {
              callback(null, fw);
            })
            .catch((err) => {
              // console.error(`query fw from FOTA error: ${err.message}`);
              // http status code:401, error_code:111 时需要刷新access token
              if (err.response && err.response.status && err.response.status == 401) {
                if (err.response.data && err.response.data.error_code && err.response.data.error_code == 111) {
                  console.warn("token expired");
                  //刷新access token
                  refreshAccessToken((err, info) => {
                    if (err) {
                      callback(err, null);
                    } else {
                      console.warn("redo");
                      queryFwFromFota(callback);
                    }
                  });
                } else {
                  callback(err.message, null);
                }
              } else {
                callback(err.message, null);
              }
              //cb(err.message, null);
            });
        } else {
        //不存在refreshToken
        console.warn('decryption failed or there is no refreshtoken');
        //需要重新注册
        //devRegister()
        devRegister((err, info) => {
          //callback(err,info);
          queryFwFromFota(callback);
        })
      }
    } else {
      //没有注册过，需要完成注册流程后再执行
      devRegister((err, info) => {
        //callback(err,info);
        queryFwFromFota(callback);
      })
    }
  } catch (ex) {
    console.error("query fw from FOTA exception:", ex);
    callback(ex.message, null);
  }
}

/*
事件通知
*/
async function eventNotification(eventId, messageVar, callback) {
  try {
    //获取设备信息
    let devInfo = await getDevInfo()
    let macAdd = devInfo.macAddress.toUpperCase();
    //密文
    let acc = await getFotaAccount();    
    let key = macAdd.replace(/:/gi, '') + 'ABCD';
    //获取FOTA配置文件
    let setting = await getFOTASetting();
    //User-Agent format: DNH-DNH-200-Ax-Default/1.01.01
    let agentStr = `${setting.series}-${setting.model}-${setting.hwVersion}-${setting.variant}/${devInfo.fwVersion[0]}.${devInfo.fwVersion[1]}.${devInfo.fwVersion[2]}`
    // console.log('agentStr:', agentStr);
    
    //检查是否存在Account文件
    if (acc) {
      //读取
      // console.log('密文：', acc.toString());
      //解密
      let dec = await decrypt(acc.toString(), key)
      // console.log('明文', dec);
      let content = JSON.parse(dec);
      //是否存在refreshToken
      if (content && content.macAddress && content.macAddress == macAdd && content.hasOwnProperty('refreshToken')) {
        //获取最新access token

        //发送事件通知
        let event_option = {
          method: "post",
          headers: {
            "User-Agent": agentStr,
            authorization: "Bearer " + content.accessToken,
          },
          url: setting.endpoint + "/device/v1/me/event",
          data: {
            event_id: eventId,
            variables: messageVar,
          },
          httpsAgent: httpsAgent,
        };
 
        // console.log(JSON.stringify(event_option));
        console.log("process: event notification");
        httpRequest(event_option)
          .then((d) => {
            // console.log('notice : ', d)
            callback(null, "success");
          })
          .catch((err) => {
            // console.error(`event notification error: ${err.message}`);
            // if(err.response.data){
            //   console.error(JSON.stringify(err.response.data));
            // }
            // http status code:401, error_code:111 时需要刷新access token
            if (err.response && err.response.status && err.response.status == 401) {
              if (err.response.data && err.response.data.error_code && err.response.data.error_code == 111) {
                console.warn("token expired");
                //刷新access token
                refreshAccessToken((err, info) => {
                  if (err) {
                    callback(err, null);
                  } else {
                    console.warn("redo");
                    eventNotification(eventId, messageVar, callback);
                  }
                });
              } else {
                callback(err.message, null);
              }
            } else {
              callback(err.message, null);
            }
          });
      } else {
        //不存在refreshToken
        console.warn('decryption failed or there is no refreshtoken');

        //需要重新注册
        devRegister((err, registerResult) => {
          if (err) {
            console.error(err);
            callback(err, null);
          } else {
            eventNotification(eventId, messageVar, callback);
          }
        });
      }

    } else {
      //没有注册过，需要完成注册流程后再执行
      devRegister((err, registerResult) => {
        if (err) {
          console.error(err);
          callback(err, null);
        } else {
          eventNotification(eventId, messageVar,callback)
        }
      })
    }
  } catch (ex) {
    console.error("event notification exception:", ex);
    callback(ex.message, null);
  }

}

//取消下载业务
const CancelToken = axios.CancelToken;
let cancel;
let currentDown; //当前正在下载的文件

//模拟取消下载操作
// setTimeout(() => {
//   try {
//     async.waterfall(
//       [
//         //1.取消下载
//         (cb) => {
//           cancel();
//           cb(null, true);
//         },
//         //2.清除临时文件
//         (cancel, cb) => {
//           setTimeout(() => {
//             console.warn("cancel firmware download", currentDown);
//             if (currentDown) {
//               fs.unlink(currentDown, (err) => {
//                 if (err) {
//                   cb(null, false);
//                 } else {
//                   cb(null, true);
//                 }
//               });
//             } else {
//               cb(null, null);
//             }
//           }, 1000);
//         },
//         //3.设置FOTA、firmware更新状态:idle
//         (del,cb)=>{
//           setUpgradeStatus(0).then(d=>{cb(null,true)}).catch(ex=>{cb(null,false)});
//         },
//       ],
//       (err, opResult) => {
//         console.log("cancel firmware download operation completed");
//       }
//     );
//   } catch (error) {
//     console.error(error.message);
//   }
// }, 8000);

/*
固件下载
*/
function fwDownload(url, callback) {
  fse.ensureDir(fwPath);
  let pos = url.lastIndexOf('/');
  let fwFilename = url.substr(pos + 1); //'temp.bin'
  let tmpFile = '_tmp_' + fwFilename;
  let fullPath = path.join(fwPath, fwFilename);
  let tmpFullPath = path.join(fwPath, tmpFile);
  currentDown = tmpFullPath; //当前正在下载的文件
  fs.stat(tmpFullPath, (err, stat) => {
    if (err) {
      if (err.code === 'ENOENT') {
        //不存在临时文件
          axios({
            method: "get",
            // retry: 2,
            // retryDelay: 3 * 1000,
            // timeout: 20 * 1000,
            url: url,
            responseType: "stream",
            cancelToken: new CancelToken((c) => {
              cancel = c;
            }),
          })
            .then((response) => {
              //console.log(typeof response);

              let headers = response.headers;
              let fwSize = headers["content-length"];
              let md5 = headers["x-amz-meta-md5chksum"];

              const downSpin = ora("Download firmware").start();
              setTimeout(() => {
                downSpin.color = "yellow";
                downSpin.text = "Downloading...";
              }, 1000);

              let i = 0;
              let fw = response.data;

              let ws = fs.createWriteStream(tmpFullPath);
              fw.pipe(ws);

              //可读流事件监听
              fw.on("error", () => {
                setUpgradeStatus(0)
                  .then((d) => {})
                  .catch((ex) => {});
                downSpin.fail("Download exception");
                //callback("download exception", null);
              });
              fw.on("data", () => {
                fs.stat(tmpFullPath, (err, stat2) => {
                  //console.log('drain', i, err, stat2.size, stat2.size / fwSize * 100);
                  let bar = Math.floor(((stat2.size / fwSize) * 100) / 5);
                  let barText =
                    "Download progress: [" +
                    [" ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " ", " "]
                      .fill("#", 0, bar)
                      .join("") +
                    "]" +
                    ` ${Math.floor((stat2.size / fwSize) * 100)}%`;
                  // downSpin.text = `Download progress ${Math.floor(stat2.size / fwSize * 100)}% chunk:[${i}]`;
                  downSpin.text = barText;
                });
                i++;
              });
              ws.on("error", () => {
                setUpgradeStatus(0)
                  .then((d) => {})
                  .catch((ex) => {});
                console.error("an exception occurred while writing data");
                callback("an exception occurred while writing data", null);
              });
              ws.on("drain", () => {});
              ws.on("finish", () => {
                fs.stat(tmpFullPath, (err, stat2) => {
                  //console.log('drain', i, err, stat2.size, stat2.size / fwSize * 100);
                  if (err) {
                    //最后检查文件状态时出错
                    console.error("an error occurred while getting the file status");
                    callback(err, null);
                  } else {
                    if (stat2.size == fwSize) {
                      downSpin.text = `Download progress: [####################] 100% `;
                      downSpin.succeed();
                      // console.log('size', stat2.size, fwSize)
                      //
                      var stream = fs.createReadStream(tmpFullPath);
                      //计算md5值
                      let md5sum = crypto.createHash("md5");
                      let chunks = [];
                      let fwCount = 0;

                      stream.on("data", function (chunk) {
                        md5sum.update(chunk);
                        chunks.push(chunk);
                        fwCount += chunk.length;
                      });

                      stream.on("end", function () {
                        const chSpin = ora("Check firmware").start();

                        Buffer.concat(chunks, fwCount);
                        //done 验证文件完整性
                        //console.log('\t\t', buf.slice(0x38, 0x48).toString('ascii'));
                        let str = md5sum.digest("hex");

                        //done 验证FOTA信息中md5值与文件实际md5值？
                        //console.log(' MD5 :', str);
                        if (md5 == str) {
                          //console.log('MATCH');
                          chSpin.succeed("Check firmware MD5 ok");
                          console.log("MD5:", str);
                          //先检查是否存在同名的目标文件，否则移动时会报错
                          fs.access(fullPath, fs.constants.F_OK, (err) => {
                            //err即不存在目标文件
                            if (err) {
                              fse.rename(tmpFullPath, fullPath, (e) => {
                                if (e) {
                                  callback(e, null);
                                } else {
                                  callback(null, { fwPath: fwPath, fwFilename: fwFilename });
                                }
                              });
                            } else {
                              //存在目标文件
                              fs.unlink(fullPath, (err) => {
                                if (err) {
                                  callback(e, null);
                                } else {
                                  fse.rename(tmpFullPath, fullPath, (e) => {
                                    if (e) {
                                      callback(e, null);
                                    } else {
                                      callback(null, { fwPath: fwPath, fwFilename: fwFilename });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        } else {
                          chSpin.fail(`Check firmware MD5 failed`);
                          //不匹配，删除文件
                          fs.unlink(fullPath, (err, rmResult) => {
                            callback("MD5 value mismatch", null);
                          });
                        }
                      });
                    } else {
                      downSpin.fail("Download exception");
                      //callback("download exception", null);
                    }
                  }
                });
              });
            })
            .catch(function (error) {
              console.error(error.message);
            });
      } else {
        //发生其他错误
        callback(err, null);
      }
    } else {
      //存在临时文件
      console.log('temporary file found, resume download progress')
      let cache = tmpFullPath + '.cache'

      async.waterfall([
        //删除可能存在的同名目标文件
        (cb) => {
          fs.unlink(cache, (err) => {
            if (err) {
              if (err.code == 'ENOENT') {
                cb(null, true);
              } else {
                cb(err, null);
              }
            } else {
              cb(null, true);
            }
          })
        },
        //移动之前临时文件，文件名后加上".cache"
        (rmOK, cb) => {
          fse.move(tmpFullPath, cache, (err) => {
            if (err) {
              cb(err, null);
            } else {
              cb(null, true);
            }
          })
        },
        (moveOK, cb) => {
          let endPos = stat.size;
          let rFilestream = fs.createReadStream(cache);
          let ws = fs.createWriteStream(tmpFullPath);
          rFilestream.pipe(ws, { end: false });

          //可读流关闭或出错时，删除cache文件
          rFilestream.on('close', () => {
            fse.removeSync(cache);
          })
          rFilestream.on('error', () => {
            setUpgradeStatus(0)
              .then((d) => {})
              .catch((ex) => {});
            fse.removeSync(cache);
            // cb("an error occurred while reading the cache file",null);
          })

          rFilestream.on('end', () => {
            //可读流消费完
            let option_download = {
              method: "get",
              // retry: 2,
              // retryDelay: 3 * 1000,
              // timeout: 20 * 1000,
              url: url,
              headers: {
                Range: `bytes=${endPos}-`,
              },
              responseType: "stream",
              cancelToken: new CancelToken((c) => {
                cancel = c;
              }),
            };
            // console.log('request:', JSON.stringify(option_download));

            axios(option_download).then((response) => {
              //console.log(typeof response);

              let headers = response.headers
              // console.log('headers:', response.status, headers);
              let sizeStr = headers['content-range'].substr(headers['content-range'].lastIndexOf('/') + 1);
              let fwSize = parseInt(sizeStr);
              let md5 = headers['x-amz-meta-md5chksum']

              const downSpin = ora('Download firmware').start();
              setTimeout(() => {
                downSpin.color = 'yellow';
                downSpin.text = 'Downloading...';
              }, 1000);

              //console.log(JSON.stringify(headers));

              let i = 0;
              let fw = response.data

              fw.pipe(ws);

              //可读流事件监听
              fw.on('error', () => {
                setUpgradeStatus(0)
                  .then((d) => {})
                  .catch((ex) => {});
                if (ws.writableEnded) {
                  ws.end(); //下载文件流异常时，可写流也结束
                }
                downSpin.fail('Download exception');
                // cb("download exception", null);
              })
              fw.on('data', () => {
                fs.stat(tmpFullPath, (err, stat2) => {
                  //console.log('drain', i, err, stat2.size, stat2.size / fwSize * 100);
                  let bar = Math.floor(stat2.size / fwSize * 100 / 5);
                  let barText = 'Download progress: [' +
                    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',]
                    .fill('#', 0, bar)
                    .join('') +
                    ']' + ` ${Math.floor(stat2.size / fwSize * 100)}%`
                  // downSpin.text = `Download progress ${Math.floor(stat2.size / fwSize * 100)}% chunk:[${i}]`;
                  downSpin.text = barText;
                })
                i++;
              })
              fw.on('end', () => {
                if (ws.writableEnded) {
                  ws.end(); //下载文件流结束时，可写流也结束
                }
              })
              fw.on('close', () => {
                if (ws.writableEnded) {
                  ws.end(); //下载文件流关闭时，可写流也结束
                }
              })

              ws.on('error', () => {
                setUpgradeStatus(0)
                  .then((d) => {})
                  .catch((ex) => {});
                console.error('an error occurred while writing');
                // cb("an error occurred while writing", null);
              });
              ws.on('drain', () => {
              });
              ws.on('finish', () => {
                // console.error('写入finish');      
                //downSpin.succeed('Download finish');
                fs.stat(tmpFullPath, (err, stat2) => {
                  //console.log('drain', i, err, stat2.size, stat2.size / fwSize * 100);
                  if (err) {
                    //最后检查文件状态时出错
                    console.error("an error occurred while getting the file status");
                    cb(err, null);
                  } else {
                    if (stat2.size == fwSize) {
                      downSpin.text = `Download progress: [####################] 100% `;
                      downSpin.succeed();
                      //
                      var stream = fs.createReadStream(tmpFullPath);
                      //计算md5值
                      let md5sum = crypto.createHash('md5');
                      let chunks = [];
                      let fwCount = 0;

                      stream.on('data', function (chunk) {
                        md5sum.update(chunk);
                        chunks.push(chunk);
                        fwCount += chunk.length;
                      });

                      stream.on('end', function () {

                        const chSpin = ora('Check firmware').start();

                        Buffer.concat(chunks, fwCount);
                        //done 验证文件完整性
                        //console.log('\t\t', buf.slice(0x38, 0x48).toString('ascii'));
                        let str = md5sum.digest('hex');

                        //done 验证FOTA信息中md5值与文件实际md5值？
                        //console.log(' MD5 :', str);
                        if (md5 == str) {
                          //console.log('MATCH');
                          chSpin.succeed("Check firmware MD5 ok")
                          console.log("MD5:", str);
                          //先检查是否存在同名的目标文件，否则移动时会报错
                          fs.access(fullPath, fs.constants.F_OK, (err) => {
                            //err即不存在
                            if (err) {
                              fse.move(tmpFullPath, fullPath, (e) => {
                                if (e) {
                                  cb(e, null);
                                } else {
                                  cb(null, { fwPath: fwPath, fwFilename: fwFilename });
                                }
                              })
                            } else {
                              //目标文件已存在
                              fs.unlink(fullPath, (err) => {
                                if (err) {
                                  cb(err, null);
                                } else {
                                  fse.move(tmpFullPath, fullPath, (e) => {
                                    if (e) {
                                      cb(e, null);
                                    } else {
                                      cb(null, { fwPath: fwPath, fwFilename: fwFilename });
                                    }
                                  })
                                }
                              })
                            }
                          });
                        } else {
                          chSpin.fail(`Check firmware MD5 failed`);
                          //不匹配，删除文件
                          fs.unlink(fullPath, (err, rmResult) => {
                            cb("MD5 value mismatch", null);
                          });
                        }
                      });
                    } else {
                      downSpin.fail('Download exception');
                      //cb("download exception", null);
                    }
                  }
                })
              });
            }).catch(function (err) {
              //status code 416: 已存在同名temp文件的大小大于等于需下载的文件，删除之
              console.error(err.message);
              if (err.response && err.response.status && err.response.status == 416) {
                fs.unlink(tmpFullPath, (err, rmResult) => {});
              }
            });
          })
        }
      ], (err, result) => {
        callback(err, result);
      })
    }
  })
}

/**
 * 执行固件更新
 * @param {固件路径} fwFilePath 
 * @param {固件文件名} fwFilename 
 * @param {*} callback 
 */
function doFwUpgrade(fwFilePath, fwFilename, callback) {
  systemCli.getFirmwareUpgradeStatusBySo(function (err, upgradeStatus) {
    if (null == err) {
      if (upgradeStatus == 40051) {
        console.warn("firmware upgrade is busy");
        callback(upgradeStatus, null);
      } else {
        console.log("start to upgrade the firmware...");
        systemCli.setFirmwareUpgradeStatusBySo(1, (err, setResult) => {
          if (err) {
            console.error(err);
          } else {
            //终止console服务
            systemCli.killConsolesBySo((err, result) => {
              if (err) {
                callback("an exception occurred while closing the console", null);
              } else {
                console.log("firmware file verification");
                systemCli.checkHeaderAndPayloadBySo([fwFilePath + "/", fwFilename], (err, checkResult) => {
                  if (err == null) {
                    //源路径,文件名,目标路径
                    console.log("unpack, ready to execute");
                    systemCli.unTarBySo([fwFilePath + "/", "payload.tar", fwFilePath + "/"], (err, unTarResult) => {
                      if (err == null) {
                        console.log("start to execute firmware upgrade now");
                        // auditLogC.saveAuditLog({
                        //   userId: opeUserId,
                        //   operationType: 5, //Edit
                        //   objectEntity: 11, //System Settings
                        //   messageType: 'systemSettings23',
                        //   location: location,
                        //   fileName: fwFilename
                        // });
                        setTimeout(function () {
                          systemCli.fwUpgradeBySo((err, result) => {});
                        }, 1000);

                        callback(null, "Success");
                      } else {
                        console.error("failed to untar the firmware file: " + err);
                        systemCli.setFirmwareUpgradeStatusBySo(0, (err, result) => {});
                        callback(err, null);
                      }
                    });
                  } else {
                    console.error("check the firmware file is invalid: " + err);
                    systemCli.setFirmwareUpgradeStatusBySo(0, (err, result) => {});
                    callback(err, null);
                  }
                });
              }
            });
          }
        });
      }
    } else {
      console.error("failed to get the firmware upgrade status: " + err);
      callback(err, null);
    }
  });
}

/**
 * 主业务流程
 */
function main () {
  // process.argv.forEach((val, index) => {
  //   console.warn(`${index}: ${val}`);
  // });
  async.waterfall([
    (cb) => {
      db.init()
        .then((d) => {
          cb(null, true);
        })
        .catch((ex) => {
          //console.error("db init exception:", ex);
          cb(ex, null);
        });
    },
    async (initResult, cb) => {
      //获取设备名称
      let devName = await getDeviceName();
      //发送消息
      if (process.argv.length > 3 && process.argv[2] == "-event") {
        console.info("begin send notification");
        //done 监测在板子上运行时是否有正常触发
        fs.appendFileSync("/userdata/notice.log", `${new Date()}\temmit\r\n`);
        if (process.argv[3] == "success") {
          //获取设备名称
          // let devName = "DNH-200"
          // 发送事件：升级成功
          fs.appendFileSync("/userdata/notice.log", `${new Date()}\nsend notice[0101002]\r\n`);
          eventNotification("0101002", [].concat(devName), (err, noticeResult) => {
            console.log(`send notification:${noticeResult ? noticeResult : err}`);
            //更新设备信息
            fs.appendFileSync("/userdata/notice.log", `${new Date()}\nupdate device\r\n`);
            devInfoUpdate((err, updateResult) => {
              fs.appendFileSync("/userdata/notice.log", `${new Date()}\nupdate device[${updateResult}]\r\n`);
              console.log(`update device:${updateResult ? updateResult : err}`);
            });
          });
        } else {
          //保留，暂无实现
          console.log(`send notification:[${process.argv[3]}] complete`);
        }
      } else {
        //固件信息查询及固件下载
        console.info("firmware check & upgrade");
        //获取FOTA schedule配置
        let schedule = await getFOTASchedule();
        let useBeta = 0;
        queryFwFromFota((err, data) => {
          // console.log('data:', err, JSON.stringify(data));
          systemCli.getFirmwareVersionBySo((err, curVer) => {
            if (err) {
              console.error("getFirmwareVersion:", err);
            } else {
              // console.log('current version:', curVer);
              let verArray = curVer.split(".");
              if (schedule && schedule.enable && schedule.updateBetaFw) {
                useBeta = 1;
              }
              systemCli.analyzeFirmwareInfoBySo(
                [verArray[0], verArray[1], verArray[2], JSON.stringify(data), useBeta],
                (err, info) => {
                  // console.log('analysis:', err, JSON.stringify(info));
                  if (err) {
                    console.error("analyzeFirmwareInfo:", err);
                  } else {
                    //检查分析结果
                    if (info && info.hasOwnProperty("result") && info.result == 1) {
                      if (info.hasOwnProperty("firmwareStatus") && [2, 3].includes(info.firmwareStatus)) {
                        systemCli.getFOTAUpdateStatusBySo((err, fotaStatus) => {
                          if (err) {
                            console.error("getFOTAUpdateStatus:", err);
                          } else {
                            if (fotaStatus == 40050) { //info.firmwareStatus == 2 &&
                              //有url
                              if (info.url) {
                                //下载前设置状态
                                setUpgradeStatus(1)
                                  .then((setBusy) => {
                                    //都设置成功后开始下载
                                    fwDownload(info.url, (errDownload, fwInfo) => {
                                      //下载完成后设置状态
                                      setUpgradeStatus(0)
                                        .then((setIdle) => {
                                          //都设置成功后开始更新
                                          if (errDownload) {
                                            console.error("download error:", errDownload);
                                          } else {
                                            async.parallel(
                                              [
                                                (cb) => {
                                                  // let devName = "DNH-200"
                                                  // 发送事件：准备升级
                                                  eventNotification("0101001",[].concat(devName),(err, noticeResult) => {
                                                      if (err) {
                                                        console.error("send notification error:", err);
                                                      } else {
                                                      }
                                                      cb(err, "success");
                                                    }
                                                  );
                                                },
                                                (cb) => {
                                                  doFwUpgrade(fwInfo.fwPath, fwInfo.fwFilename, (e, d) => {
                                                    if (e) {
                                                      console.error(e);
                                                    } else {
                                                      console.log(d);
                                                    }
                                                    cb(err, d);
                                                  });
                                                },
                                              ],
                                              (err, result) => {
                                                console.log("finish:", err, result);
                                              }
                                            );                                           
                                          }
                                        })
                                        .catch((ex) => {
                                          console.error("failed to set upgrade state to idle:", err);
                                        });
                                    });
                                  })
                                  .catch((ex) => {
                                    console.error("failed to set upgrade state to busy:", err);
                                  });
                              } else {
                                console.warn("firmware download URL not provided");
                              }
                            } else {
                              //3: Mandatory
                              //todo 如何处理待定
                            }
                          }
                        });
                      } else {
                        //没有可用的fw info
                        console.log("firmware is up to date");
                      }
                    } else {
                      console.warn("invalid Input Parameter");
                    }
                  }
                }
              );
            }
          });
        });
      }
    },
  ], (err, result) => {
    if (err) {
      console.error(err);
    } else {
      //执行完成
    }
  })
}

main()
//消息阶段：下载中,下载完成,校验,准备OK,异常

