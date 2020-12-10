var fs = require("fs");
var Database = require("better-sqlite3");
const console = require('./console');
//const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

var SqliteDB = function () {
  var db = undefined;
  this.open = function (dbFilePath) {
    var exist = fs.existsSync(dbFilePath);
    if (!exist) {
      console.error("SQLite datebase file not exists: " + dbFilePath);
      //fs.openSync(dbFilePath, "w");
    }
    this.db = new Database(dbFilePath, {
      fileMustExist: true,
      // verbose: console.light,
      timeout: 20000,
    });
    if (dbFilePath.indexOf("/system-data.db") < 0) {
      this.db.pragma("journal_mode = WAL");
    }
    if (dbFilePath.indexOf("/config-data.db") < 0) {
      this.db.pragma("synchronous = OFF");
    }
    this.db.pragma("auto_vacuum = FULL");
    this.db.pragma("secure_delete = ON");
  };
  this.createTable = function (sql, callback) {
    const info = this.db.prepare(sql).run();
    callback(null, info);
  };
  this.insertData = function (sql, object, callback) {
    try {
      this.db.prepare(sql).run();
      if (callback && "function" === typeof callback) {
        callback(null, object);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, sql);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code, null);
      }
    }
  };
  this.queryData = function (sql, callback) {
    try {
      const rows = this.db.prepare(sql).all();
      if (callback && "function" === typeof callback) {
        callback(null, rows);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, sql);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code, null);
      }
    }
  };
  this.singleQueryData = function (sql, callback) {
    try {
      const row = this.db.prepare(sql).get();
      if (callback && "function" === typeof callback) {
        callback(null, row);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, sql);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code, null);
      }
    }
  };
  this.updateData = function (sql, update, callback) {
    try {
      this.db.prepare(sql).run();
      if (callback && "function" === typeof callback) {
        callback(null, update);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, sql);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code, null);
      }
    }
  };
  this.removeData = function (sql, callback) {
    try {
      this.db.prepare(sql).run();
      if (callback && "function" === typeof callback) {
        callback(null);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, sql);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code);
      }
    }
  };
  this.proc = function (sql, callback) {
    try {
      let result = this.db.prepare(sql).run();
      if (callback && "function" === typeof callback) {
        callback(null, result.changes);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, sql);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code, null);
      }
    }
  };
  this.exec = function (cmd, callback) {
    try {
      let result = this.db.exec(cmd);
      if (callback && "function" === typeof callback) {
        callback(null, result.changes);
      }
    } catch (sqliteError) {
      printErrorInfo(sqliteError, cmd);
      if (callback && "function" === typeof callback) {
        callback(sqliteError.code, null);
      }
    }
  };
  this.batchProcessData = function (sql, objects, callback) {
    var promises = [];
    var stmt = this.db.prepare(sql);
    for (var i = 0; i < objects.length; ++i) {
      promises.push(
        new Promise((resolve, reject) => {
          try {
            var arr = new Array();
            if (objects[i] instanceof Array) {
              for (var k = 0; k < objects[i].length; k++) {
                var str = objectValueToString(objects[i][k]);
                arr.push(str);
              }
            } else if (objects[i] instanceof Object) {
              for (var k in objects[i]) {
                if (objects[i].hasOwnProperty(k)) {
                  var str = objectValueToString(objects[i][k]);
                  arr.push(str);
                }
              }
            }
            stmt.run(arr);
            resolve(null);
          } catch (sqliteError) {
            resolve({ code: sqliteError.code, message: sqliteError.message });
          }
        })
      );
    }
    Promise.all(promises).then((errs) => {
      if (callback && "function" === typeof callback) {
        var err = null;
        for (var e = 0; e < errs.length; e++) {
          if (null != errs[e]) {
            printErrorInfo(errs[e], sql);
            err = errs[e];
            break;
          }
        }
        if (null == err) {
          callback(null, objects);
        } else {
          callback(err, null);
        }
      }
    });
  };
  this.checkpoint = function () {
    this.db.checkpoint();
  };
  this.close = function () {
    this.db.close();
  };
};

function printErrorInfo(err, sql) {
  err.code = err.code != null ? err.code : "SQLITE_ERROR";
  console.error(err.code + ":: " + err.message + ", SQL:: " + sql);
}

function objectValueToString(obj) {
  var str = "";
  if (null == obj) return str;
  if (typeof obj == "object") {
    if ("Moment" == obj.constructor.name) {
      str = obj.toISOString();
      //str = obj.format('YYYY-MM-DD HH:mm:ss');
    } else if ("Date" == obj.constructor.name) {
      str = obj.toISOString();
    } else {
      str = JSON.stringify(obj);
    }
  } else if (typeof obj == "string") {
    if ("true" == obj) {
      str = true;
    } else if ("false" == obj) {
      str = false;
    } else {
      str = obj.toString();
    }
  } else if (isNaN(obj)) {
    //str = '';
  } else if (typeof obj == "boolean") {
    if (obj) {
      str = 1;
    } else {
      str = 0;
    }
  } else if (typeof obj == "number") {
    str = obj;
  } else {
    str = obj.toString();
  }
  return str;
}

SqliteDB.prototype.open = this.open;
SqliteDB.prototype.createTable = this.createTable;
SqliteDB.prototype.insertData = this.insertData;
SqliteDB.prototype.queryData = this.queryData;
SqliteDB.prototype.singleQueryData = this.singleQueryData;
SqliteDB.prototype.updateData = this.updateData;
SqliteDB.prototype.removeData = this.removeData;
SqliteDB.prototype.proc = this.proc;
SqliteDB.prototype.exec = this.exec;
SqliteDB.prototype.batchProcessData = this.batchProcessData;
module.exports = SqliteDB;
