/**
 * Created by lizhimin on 2017/6/9.
 */
define(["filterModule"], function (fliters) {

    fliters.filter('vlanTagDetail', function (utils) {
        return function (input) {
            var vlanText = utils.getVlanText();
            var result = "";
            if (input) {
                for (var key in input) {
                    if (key == 'index' || key == 'vid' || key == 'name') continue;
                    if (input[key] == 1) {
                        result += vlanText[key] + ', ';
                    }
                }
                ;
            }
            if (result.length > 0) {
                result = result.slice(0, -2);

            }
            return result;
        };
    });
    fliters.filter('vlanUnTagDetail', function (utils) {
        return function (input) {
            var result = "";
            var vlanText = utils.getVlanText();
            if (input) {
                for (var key in input) {
                    if (key == 'index' || key == 'vid' || key == 'name') continue;
                    if (input[key] == 2) {
                        result += vlanText[key] + ', ';
                    }
                }
            }
            if (result.length > 0) {
                result = result.slice(0, -2);
            }
            return result;
        };
    });
    fliters.filter('deviceLogFilter',function(TS){
       return function(input){
           var result="";
           function getKeyName(key){
               var keypaire={channel5Ghz:'5 Ghz',channel5Ghz2:'5 Ghz',channel24Ghz:'2.4 Ghz',power24Ghz:'2.4 Ghz',power5Ghz:'5 Ghz'};
               return keypaire[key];
           }

           if(input){
               for(var key in input){
                   if(key=='fwUpgrade'){
                       result+="Version: "+input[key].fwVer[0];
                   }
                   else if(key=='sslCertificate'){
                       result+='Fingerprint:'+input[key].sslVer;
                   }
                   else if(key=='profile'){
                       result+=' '+input[key]+'';
                   }
                   else if(key=='setApPower'||key=='setApChannelNum'){

                       for(var power in input[key]){
                           if(power!='category'){
                               result+=getKeyName(power)+":"+input[key][power]+", ";
                           }

                       }
                       if (result.length > 0) {
                           result = result.slice(0, -2);
                       }
                   }else if(key=='setDeviceLocation'||key=='setDeviceName'){
                       for(var power in input[key]){
                           if(power!='category'){
                               result+=input[key][power]+", ";
                           }

                       }
                       if (result.length > 0) {
                           result = result.slice(0, -2);
                       }
                   }
                   else if(key=='setStatsInterval'){
                       result+=input[key]['keepAliveInterval']+' seconds';
                   }
                   else if(key=='removeManagedDevs'||key=='addManageDevs'||key=='deleteIgnorDev'||key=='reboot'){
                       result="";
                   }
                   else  if(key=='unblockClient'||key=='blockClient'){
                       result+=' ('+input[key]['commands']+')';
                   }else{
                       result+=JSON.stringify(input[key]);
                   }

               }
           }
           return result;
       }
    });
    fliters.filter('configResultFilter', function (TS) {
        return function (input) {
            var result = "";
            if (input.resultType == 'Error') {
                if (input.execResult != '') {
                    return TS.ts('common.fail')
                } else {
                    return TS.ts('common.fail') + ':' + input.execResult;
                }
            } else if (input.resultType == 'Cancel') {
                if (input.execResult != '') {
                    return TS.ts('common.cancel')
                } else {
                    return TS.ts('common.cancel') + ':' + input.execResult;
                }
            } else {
                if (input.execResult == 'Success') {
                    return TS.ts('common.success')
                } else {
                    return TS.ts('common.success') + ':' + input.execResult;
                }
            }
            return result;
        }
    });
});