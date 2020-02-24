/**
 * Created by zhangwenyang on 2019/8/16.
 */
'use strict';
const systemCli = require("../util").common.systemCli;
process.on('message', (config) => {
    console.debug_log('FTP child process receives message: ' + JSON.stringify(config));
    systemCli.FTPDownloadBySo(config, function (err, data){
        if(null == err){
            process.send({success: true, data: data});
        }else {
            process.send({success: false, error: err});
        }
    });
});