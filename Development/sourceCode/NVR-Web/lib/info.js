/***********************************************************
 *   Description:获取系统信息
 *          Date:2019-06-06
 *        Author:jun.liu@cn.dlink.com
 *
 *   Modified By:
 * Modified Date:
 *      Comments:
 ************************************************************
 *  __                        _____
 * /\ \       __             /\___ \
 * \ \ \     /\_\  __  __    \/__/\ \  __  __    ___
 *  \ \ \  __\/\ \/\ \/\ \      _\ \ \/\ \/\ \ /' _ `\
 *   \ \ \LJ \\ \ \ \ \_\ \    /\ \_\ \ \ \_\ \/\ \/\ \
 *    \ \____/ \ \_\ \____/    \ \____/\ \____/\ \_\ \_\
 *     \/___/   \/_/\/___/      \/___/  \/___/  \/_/\/_/
 ************************************************************/

"use strict";

const fs = require('fs');
const path = require('path');
const env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";

exports.getVersion = function () {
    let cfg = path.join(process.cwd(),'config/appconfig.json')

    fs.readFile(cfg, function(err, data) {
        if (err) {
            console.log(err);
        }else{
            var jsonObj = JSON.parse(data);
            if(jsonObj.hasOwnProperty("subversion")){
                if (env == "development") {
                    console.log('Web service subversion:',jsonObj.subversion);
                }
            }
        }
    });
}