/**
 * Created by lizhimin on 2018/1/5.
 */
const util = require("../lib/util");
const db = util.db;
const operateLog=db.cwmOperationLog;
function createLog(log,callback){
    if(log){
        log.logTime=new Date;
        operateLog.save(log,callback);
    }else{
        callback('err',null);
    }
}