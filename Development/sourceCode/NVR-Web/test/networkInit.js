/**
 * Created by lizhimin on 2018/6/4.
 */

process.argv.forEach(function (val, index, array) {
    console.log(index + ': ' + val);
   if(val=='network'){
       initNetwork();
   }
   if(val =='ssid'){
       initSSID();
   }
});
function initNetwork(){
    const db = require("../lib/util").db;
    const cwmNetworkC = require("../cwmcontroller/network");
    db.cwmOrg.findOrg((err,result)=>{
        if(result){
            for(let i=0;i<20;i++){
                let network = {
                    name:`network${i}`,
                    agentUUID:getUUID(),
                    orgId:result._id.toString()
                };
                cwmNetworkC.createNetwork(network, function (result) {
                   console.log(`network ${network.name} created` );
                })
            }
        }
    })


}
function initSSID(){
    const db = require("../lib/util").db;
    const cwmNetworkC = require("../cwmcontroller/batchConfig");
    db.cwmConfigProfile.findAll((err,result)=>{
        if(result){
            let promises=[];
            for(let k=0;k<result.length;k++){
                let profile=result[k];
                for(let i=2;i<=8;i++){
                    let ssid = {
                        band: 1,
                        ssidIndex:i,
                        characterSet: 1,
                        authentication:1,
                        encryption:0,
                        broadcast: 1,
                        ssid:`test ssid ${i}`,
                        wmm: 1,
                        macAccessControl: 3,
                        macList: [],
                        macByPass: [],
                        subCfgIDMacACL: 0,
                        authType: 0
                    };
                    promises.push(new Promise((resolve,reject)=>{
                        cwmNetworkC.addSSID(profile._id,ssid,'createAll',(err,re)=>{
                            if(err){
                                reject(err);
                            }else{
                                resolve(re);
                            }
                            console.log(`create ssid ${ssid.ssidIndex} for network ${profile.uuid} ok!`);
                        })
                    }))

                }
            }
            Promise.all(promises).then((result)=>{

                process.exit(0);
            })
        }
    })

}
function getUUID(){
    let objId = cwmNetwork.getObjectId().toString();
    let uuid = (objId.substr(0, 4) + "-" + objId.substr(4, 8) + "-" + objId.substr(12, 8) + "-" + objId.substr(20, 4)).toUpperCase();
    return uuid;
}
