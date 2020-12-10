const fs = require("fs");
const fse = require("fs-extra");
const console = require("./console");
var sqlite = require("./sqlite");
const dbPath = "/userdata/config/config-data.db";
const tableName = "CWM_Secret";

/**
 * 数据库初始化
 */
function init() {
  return new Promise((resolve, reject) => {
    //检查数据库是否存在
    fse
      .pathExists(dbPath)
      .then((exists) => {
        if (exists) {
          //存在
          //检查表是否存在
          //不存在则创建
          var db = new sqlite();
          db.open(dbPath);
          db.queryData(`PRAGMA table_info([${tableName}])`, function (err, columns) {
            if (columns) {
              if (columns.length === 0) {
                var createSql = `CREATE TABLE ${tableName}(k TEXT, v TEXT, PRIMARY KEY(k) )`;
                db.createTable(createSql, () => {
                  db.exec("vacuum;");
                  let sql = `CREATE UNIQUE INDEX IF NOT EXISTS IDX_${tableName}_K ON ${tableName}(K)`;
                  //console.warn_log(sql);
                  db.exec(sql, () => {});
                });
                resolve(true);
              } else {
                //暂时不用做什么
                resolve(true);
              }
            } else {
              resolve(true);
            }
          });
        } else {
          //不存在
          reject("config database does not exist");
        }
      })
      .catch((ex) => {
        console.error("an exception occurred while checking the database:", ex.message);
        reject(ex.message);
      });
  });
}

/**
 * 获取FOTA加密信息
 */
function getSecret() {
  return new Promise((resolve, reject) => {
    try {
      var db = new sqlite();
      db.open(dbPath);
      db.singleQueryData(`SELECT * FROM ${tableName} WHERE k='fota'`, function (err, data) {
        if (err) {
          reject(err);
        } else {
          if (data) {
            resolve(data.v);
          } else {
            resolve(null);
          }
        }
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

/**
 * 写FOTA加密信息
 * @param {密文} value
 */
function writeSecret(value) {
  return new Promise((resolve, reject) => {
    try {
      getSecret()
        .then((exists) => {
          var db = new sqlite();
          db.open(dbPath);
          if (exists) {
            //update
            db.updateData(`UPDATE ${tableName} SET v = '${value}' WHERE k='fota'`, value, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            });
          } else {
            //insert
            db.insertData(`INSERT INTO ${tableName}(k,v) VALUES('fota','${value}')`, value, (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(true);
              }
            });
          }
        })
        .catch((ex) => {
          reject(ex);
        });
    } catch (ex) {
      reject(ex);
    }
  });
}

/**
 * 移除密文
 * @param {密文}} value
 */
function removeSecret() {
  return new Promise((resolve, reject) => {
    try {
      var db = new sqlite();
      db.open(dbPath);
      db.removeData(`DELETE FROM ${tableName} WHERE k='fota'`, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

exports.init = init;
exports.getSecret = getSecret;
exports.writeSecret = writeSecret;
exports.removeSecret = removeSecret;
