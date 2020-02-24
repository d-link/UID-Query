/***********************************************************
 *   Description:定时任务
 *          Date:2019-08-07
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
var CronJob = require('cron').CronJob;
require('expose-gc');

//自动GC任务
const jobAutoGC = new CronJob('0 5 */1 * * *', function () {
    console.log("Before GC:", JSON.stringify(process.memoryUsage()));
    global.gc();
    console.log("After  GC:", JSON.stringify(process.memoryUsage()));
});

exports.jobAutoGC = jobAutoGC;