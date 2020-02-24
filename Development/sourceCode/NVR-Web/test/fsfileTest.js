/**
 * Created by lizhimin on 2017/8/28.
 */


//const db = require("../lib/util").db;
//var gridFS = db.gridFS;
/*setTimeout(function(){
    gridFS.writeFileFromPath("E:/gitdata/DView7-SP1-Web/server/customer/DAP2690-firmware-v102-rc020.bin","loggoFile",{orgId:'111',type:"fw",group:'switdh'},(err,result)=>{
        console.log("writeFile:"+JSON.stringify(result));
    });
   /!* gridFS.readFileToLocalByName( "e:/test2.png","loggoFile",{orgId:'111',type:"orgLogo",group:'dap'},(rs)=>{
        console.log("readFile:"+rs);
    });*!/
   /!* gridFS.getAllFileList({orgId:'111',type:"orgLogo",group:'dap'},(files)=>{
        console.log("getAllFiles:"+JSON.stringify(files));
    });*!/
},1000);*/

/*(function () {
    gridFS.writeFileFromPath("E:/gitdata/DView7-SP1-Web/server/customer/DAP2690-firmware-v102-rc020.bin","loggoFile",{orgId:'111',type:"fw",group:'switdh'},(err,result)=>{
        console.log("writeFile:"+JSON.stringify(result));
    });
})();*/
var async = require('async');

async.waterfall([
    function(callback){
        callback(null, 'one', 'two');
        console.log('1');
    },
    function(arg1, arg2, callback){
        callback(null, 'three');
        console.log(arg1);
        console.log(arg2);
    },
    function(arg1, callback){
        // arg1 now equals 'three'
        callback(null, 'done');
        console.log(arg1);
    }
], function (err, result) {
    console.log(result);
    // result now equals 'done'
    //  console.log('4');
});

