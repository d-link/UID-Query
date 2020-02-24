const validator = require("validator");
const utils = require("./util");
const regCheckUtils = require("./regCheckUtils");
/**
 * @description 密码正则校验L1——规则：8到30位字符，大写英文或小写英文、数字
 */
exports.passwordL1 = (str) => {
    return /^(?![^A-Za-z]+$)(?![^0-9]+$)[\x21-\x7e]{8,30}$/.test(str);
}
/**
 * @description 用户名
 * 最长32个字符，不限制长度
 */
exports.username = (str) => {
    if(!str){
        return false;
    }
    if(str.length < 3 || str.length > 32){
        return false;
    }
    return true;
}
/**
 * @description 结构名
 * 最长32个字符,可不填
 */
exports.orgName = (str) => {
    if(str && str.length > 32){
        return false;
    }
    return true;
}
/**
 * @description 地址
 * 最长32个字符，不限制长度
 */
exports.address = (str) => {
    if(str && str.length > 32){
        return false;
    }
    return true;
}
/**
 * @description 联系电话
 * 
 * @date 2020-0102 规则：“数字” “+” “空格” “不限长度”
 */
exports.phone = (str) => {
    //return /^[0-9]*$/.test(str);
    return /^\+?[0-9|\s*]{1,}$/.test(str);
}
/**
 * @description 校验日期格式"yyyy-MM-dd HH:mm:ss"
 */
exports.isDateFormat = (str) => {
    return /^[0-9]{4}-[0-9]{1,2}-[0-9]{1,2} [0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(str);
}
/**
 * @description 时区校验 
 * 对标：\public\website1\public\scripts\common\utilService.js getTimeZones()
 */
exports.isTimeZone = (str) => {
    return str >= 1 && str <= 79;
}

/**
 * @description 邮箱
 */
exports.isEmail = (str) => {
    return validator.isEmail(str);
}
/**
 * @description 帐号权限
 */
exports.isRole = (str) => {
    return ['root admin', 'root user', 'local admin', 'local user', 'front desk user'].indexOf(str) > -1;
} 

exports.isPrivilegeStatus = (str) => {
    return ["enabled","disabled"].indexOf(str) > -1;
}
/**
 * @description IPv4|| IPv6
 */
exports.isIpAddress = (str) => {
    return /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/.test(str);
    //return /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$|^([http://]|[https://])?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/.test(str);
}
/**
 * @description IPv4|| IPv6 ||  domain 不允许带 http || https
 */
exports.isIpOrWebsite = (str) => {
    return /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$|^([http://]|[https://])?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$/.test(str);
}
/**
 * 
 */
exports.isIpOrWebsiteAllowHttp = (str) => {
    return validator.isURL(str,{
        protocols:['http','https'],//允许http和https
        require_tld:false,//允许顶级域名
        require_protocol:false,//允许不带协议
        require_host:false,//允许IP
        allow_underscores:true,//允许下滑线
        allow_protocol_relative_urls:true,//允许相对地址
    });
}
exports.isMask = (str) =>{
    return /^(254|252|248|240|224|192|128|0)\.0\.0\.0|255\.(254|252|248|240|224|192|128|0)\.0\.0|255\.255\.(254|252|248|240|224|192|128|0)\.0|255\.255\.255\.(254|252|248|240|224|192|128|0)$/.test(str);
}
exports.isGateway = (str) => {
    return /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}$/.test(str);
}
exports.isPort = (str) => {
    return validator.isPort(str+'');
}
exports.isSMTPHost = (str) => {
    return /[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/.test(str);
}
exports.isSMTPPort = (str) => {
    return [25,465,587].indexOf(str) > -1;
}
exports.isSMTPFromName = (str) => {
    if(str.length > 32){
        return false;
    }
    return /^[\u4E00-\u9FA5A-Za-z0-9_.,;:?\\\[\]()@#$&+=%!-]+$/.test(str);
}
exports.isSMTPAuthPassword = (key,pwd) => {
    if(!key || !pwd) return false;
    pwd = utils.decrptyMethod(key,pwd);
    if(pwd.length < 5){
        return false;
    }
    return /^[\x00-\x7f]*$/.test(pwd);
}
/**
 * @description 支付的币种
 */
exports.isPayPalCurrency = (str) => {
    return ['USD', 'AUD', 'GBP', 'CAD', 'CZK','DKK', 'EUR', 'HKD', 'ILS', 'MXN',
    'NZD', 'NOK', 'PHP', 'PLN', 'RUB','SGD', 'SEK', 'CHF', 'THB', 'BRL'].indexOf(str) > -1
}

function checkCost (str){
    return /^[0-9]+([.]{1}[0-9]{1,2})?$/.test(str) && str >= 0.01 && str <= 1024.00;
}
exports.isPayPalOptions = (data) => {
    if(!data){
        return false;
    }
    if(['unitMin', 'unitHour', 'unitDay'].indexOf(data.type) == -1){
        return false;
    }
    if(data.type == 'unitMin'){
        if(data.duration >= 1 && data.duration <= 259200 && checkCost(data.cost)){
            return true;
        }
    }else if(data.type == "unitHour"){
        if(data.duration >= 1 && data.duration <= 4320 && checkCost(data.cost)){
            return true;
        }
    }else if(data.type == "unitDay"){
        if(data.duration >= 1 && data.duration <= 180 && checkCost(data.cost)){
            return true;
        }
    }else{
        return false;
    }
} 

/***
 * @description network 
 */
exports.isNetwork = (str) => {
    if(str || (str+"").length <= 32){
        return !/[/\\<>:?*\"|.]/gi.test(str);
    }
    return false;
}

/***
 * @description site 
 */
exports.isSite = (str) => {
    if(str || (str+"").length <= 32){
        return true;
    }
    return false;
}
/**
 * @description ssid
 */
exports.isSSID = (str) => {
    if(str || (str+"").length <= 32){
        return /^[A-Za-z0-9_.,;:?\[\]<>/\*{}^\|()@#$+=%!\s-]+$/.test(str);
    }
    return false;
}
/**
 * @description passPhrase
 */
exports.isPassPhrase = (key,pwd,authentication) => {
    if(!key || !pwd) return false;
    pwd = utils.decrptyMethod(key,pwd);
    let min = 8;
    let max = 64;
    if([1,101].indexOf(authentication) > 0){
        min = 13;
        max = 13;
        if(pwd.length == 13){
            return true;
        }
        return false;
    }else{
        if(pwd.length > max || pwd.length < min){
            return false;
        }else if(pwd.length < 64){
            return true;
        }else {
            return /^[0-9A-Fa-f]{0,64}$/.test(pwd);
        }
    }
}

/**
 * @description guestSSIDName
 */
exports.isGuestSSIDName = (str) => {
    if(str || (str+"").length <= 32){
        return /^[A-Za-z0-9_.,;:?\[\]<>/\*{}^\|()@#$+=%!\s-]+$/.test(str);
    }
    return false;
}
exports.isGuestSSIDAddName = (str) => {
    if(str || (str+"").length <= 32){
        return true;
    }
    return false;
}

/**
 * @description countryCode
 */
exports.isCountryCode = (obj) => {
    if(!obj || !obj.ccode || !obj.id || !obj.name){
        return false;
    }
    let countryCodeList = regCheckUtils.getCountries();
    let rest = countryCodeList.find(item => {
        if(item.id = obj.id && item.ccode == obj.ccode && item.name == obj.name){
            return true;
        }
        return false;
    })
    if(rest){
        return true;
    }
    return false;
}

/**
 * @description sntpTimeZoneIndex
 */
exports.isSntpTimeZoneIndex = (obj) => {
    if(!obj || !obj.id || !obj.name){
        return false;
    }
    let timeZonesList = regCheckUtils.getTimeZones();
    let rest = timeZonesList.find(item => {
        if(item.id = obj.id && item.name == obj.name){
            return true;
        }
        return false;
    })
    if(rest){
        return true;
    }
    return false;
}

/**
 * @description devSet.userName
 */
exports.isDevSetUserName = (str) => {
    return /^[0-9A-Za-z]{0,64}$/.test(str);
}


////////////////////////////////////////////////
////// profile setting
/** 
 * @description isVlanName
 */
exports.isVlanName = (str) => {
    if(str || (str+"").length <= 32 || (str+"").length > 0){
        return true;
    }
    return false;
}
/** 
 * @description isVlanId
 */
exports.isVlanId = (str) => {
    return /^([1-3]\d{3}|40[1-8]\d|409[1-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/.test(str);
}
exports.checkVlanObject = (vlan) => {
    if(!vlan) return false;
    if(!this.isVlanName(vlan.name)) return false;
    if(!this.isVlanId(vlan.vid)) return false;
    let allAttr = [
        //ssid24
        'primary24g', 'ssid24g1', 'ssid24g2', 'ssid24g3', 'ssid24g4',
        'ssid24g5', 'ssid24g6', 'ssid24g7',
        //ssid5
        'primary5g', 'ssid5g1', 'ssid5g2', 'ssid5g3', 'ssid5g4','ssid5g5', 
        'ssid5g6', 'ssid5g7',
        //ssidSec5
        'primarySec5g', 'ssidSec5g1', 'ssidSec5g2', 'ssidSec5g3', 'ssidSec5g4',
        'ssidSec5g5', 'ssidSec5g6', 'ssidSec5g7'
    ];
    let rest = allAttr.find(item => {
        if(typeof vlan[item] == "undefined"){//属性未传入
            return true;
        }else if([0,2,"0","2"].indexOf(vlan[item]) == -1){//传入的不是指定值
            return true;
        }
        return false;
    });
    if(rest) return false;

    let allAttr2 = ['mgmt','lan1','lan2'];
    let rest2 = allAttr2.find(item => {
        if(typeof vlan[item] == "undefined"){//属性未传入
            return true;
        }else if([0,1,2,"0","1","2"].indexOf(vlan[item]) == -1){//传入的不是指定值
            return true;
        }
        return false;
    });
    if(rest2) return false;

    return true;
}

exports.checkBandWidthOptRule = (bandwidth) => {
    if(!bandwidth) return false;
    if([0,1,"0","1"].indexOf(bandwidth.status) == -1) return false;
    //downlinkBW 限制 1~1300
    if(!/^(1300)|^(1[0-2]\d{2})|^([1-9]\d{0,2})$/.test(bandwidth.downlinkBW)) return false;
    //uplinkBW 限制 1~1300
    if(!/^(1300)|^(1[0-2]\d{2})|^([1-9]\d{0,2})$/.test(bandwidth.uplinkBW)) return false;

    if(!bandwidth.rule) return false;
    if(bandwidth.rule.length == 0) return true;
    let rest = bandwidth.rule.find(item => {
        if([1, 2, 3, 4].indexOf(item.type) == -1) return true;
        if([1, 2, 3].indexOf(item.band) == -1) return true;
        if([1, 2, 3, 4, 5, 6, 7, 8].indexOf(item.ssidIndex) == -1) return true;
        if([1, 2].indexOf(item.downSpeedType) == -1) return true;
        if([1, 2].indexOf(item.upSpeedType) == -1) return true;
        if(item.upSpeed > bandwidth.uplinkBW * (item.upSpeedType == 1? 1000:1)) return true;
        if(item.downSpeed > bandwidth.downlinkBW * (item.downSpeedType == 1? 1000:1)) return true;
        return false;
    })
    if(rest) return false;
    return true;
}

exports.checkRFOptimization = (rfOpt) => {
    if(!rfOpt) return false;
    if(typeof rfOpt.subCfgID == "undefined") return false;
    if([0,1].indexOf(rfOpt.enableACA) == -1) return false;
    if([0,1].indexOf(rfOpt.enableAPA) == -1) return false;
    if([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].indexOf(rfOpt.rfReportFrequency) == -1) return false;
    return true;
}

exports.checkWirelessSchedule = (schedule) => {
    if(!schedule) return false;
    if(typeof schedule.subCfgID == "undefined") return false;
    if([0,1].indexOf(schedule.status) == -1) return false;
    if(typeof schedule.ruleList == "undefined") return false;
    if(schedule.ruleList.length == 0) return true;
    let weeks = [0, 1, 2, 4, 8, 16, 32, 64, "1", "2", "4", "8", "16", "32", "64"];
    let rest = schedule.ruleList.find(item => {
        if([0,1].indexOf(item.allDaySelect) == -1) return true;
        if(weeks.concat(item.daysSelect.filter(ditem => weeks.indexOf(ditem) == -1)).length != weeks.length) return true;
        if(!/^(?:(?:[0-2][0-3])|(?:[0-1][0-9])):[0-5][0-9]$/.test(item.endTime)) return true;
        if([0,1].indexOf(item.nodeStatus) == -1) return true;
        if([0,1].indexOf(item.overnight) == -1) return true;
        if(!/^[A-Za-z0-9_.,;:?\[\]<>/\*{}^\|()@#$+=%!\s-]+$/.test(item.ruleName)) return true;
        if(!this.isSSID(item.ssid)) return true;
        if(!(item.ssidIndex >= 0)) return true;
        if(!/^(?:(?:[0-2][0-3])|(?:[0-1][0-9])):[0-5][0-9]$/.test(item.startTime)) return true;
        if(item.startTime > item.endTime && item.overnight == 0) return true;
        return false;
    });
    if(rest) return false;
    return true;
}

exports.checkDeviceSetting = (deviceSetting) => {
    let result = [];
    if(!deviceSetting) {
        result.push({status: false, reason: "no device setting"});
    }
    //countrycode
    let countryCodeList = regCheckUtils.getCountries();
    if(!countryCodeList.find(item => item.id == deviceSetting.countrycode)) {
        result.push({status: false, reason: "error country code"});
    }
    //sntpDayLightSavingOffset
    if([15, 30, 45, 60, 75, 90, 105, 120].indexOf(deviceSetting.sntpDayLightSavingOffset) == -1) {
        result.push({status: false, reason: "error sntp day light offset"});
    }
    if([0,1].indexOf(deviceSetting.sntpDaylightSaving) == -1) {
        result.push({status: false, reason: "error sntp day light saving"});
    }
    //sntpDstEndCurrentHour
    let endHour = deviceSetting.sntpDstEndCurrentHour;
    if(!(Number.isInteger(endHour) && 0 <= endHour && endHour <= 23)) {
        result.push({status: false, reason: "error sntp end hour"});
    }
    //sntpDstEndCurrentMin
    let endMin = deviceSetting.sntpDstEndCurrentMin;
    if(!(Number.isInteger(endMin) && 0 <= endMin && endMin <= 59)) {
        result.push({status: false, reason: "error sntp current min"});
    }
    //sntpDstEndDayOfWeek
    if([0,1,2,3,4,5,6].indexOf(deviceSetting.sntpDstEndDayOfWeek) == -1) {
        result.push({status: false, reason: "error sntp end day of week"});
    }
    //sntpDstEndMonth
    if([1,2,3,4,5,6,7,8,9,10,11,12].indexOf(deviceSetting.sntpDstEndMonth) == -1) {
        result.push({status: false, reason: "error sntp end month"});
    }
    //sntpDstEndWeek
    if([1, 2, 3, 4, 5].indexOf(deviceSetting.sntpDstEndWeek) == -1) {
        result.push({status: false, reason: "errro sntp end week"});
    }
    //sntpDstStartCurrentHour
    let startHour = deviceSetting.sntpDstStartCurrentHour;
    if(!(Number.isInteger(startHour) && 0 <= startHour && startHour <= 23)) {
        result.push({status: false, reason: "error sntp start current hour"});
    }
    //sntpDstStartCurrentMin
    let startMin = deviceSetting.sntpDstStartCurrentMin;
    if(!(Number.isInteger(startMin) && 0 <= startMin && startMin <= 59)) {
        result.push({status: false, reason: "error sntp start current minute"});
    }
    //sntpDstStartDayOfWeek
    if([0,1,2,3,4,5,6].indexOf(deviceSetting.sntpDstStartDayOfWeek) == -1) {
        result.push({status: false, reason: "error sntp start day of week"});
    }
    //sntpDstStartMonth
    if([1,2,3,4,5,6,7,8,9,10,11,12].indexOf(deviceSetting.sntpDstStartMonth) == -1) {
        result.push({status: false, reason: "error sntp start month"});
    }
    //sntpDstStartWeek
    if([1, 2, 3, 4, 5].indexOf(deviceSetting.sntpDstStartWeek) == -1) {
        result.push({status: false, reason: "error sntp start week"});
    }
    //sntpServerIP
    if(deviceSetting.sntpServerIP != "" && !this.isIpOrWebsiteAllowHttp(deviceSetting.sntpServerIP)) {
        result.push({status: false, reason: "error sntp server ip"});
    }
    //sntpStatus
    if([0,1].indexOf(deviceSetting.sntpStatus) == -1) {
        result.push({status: false, reason: "error sntp status"});
    }
    //sntpTimeZoneIndex
    let timeZonesList = regCheckUtils.getTimeZones();
    if(!timeZonesList.find(item => item.id == deviceSetting.sntpTimeZoneIndex)) {
        result.push({status: false, reason: "error ntp timezone"});
    }
    //ssh
    if([0,1].indexOf(deviceSetting.ssh) == -1) {
        result.push({status: false, reason: "error ssh setting"});
    }
    //subCfgID
    if(typeof deviceSetting.subCfgID == "undefined") {
        result.push({status: false, reason: "error sub cfgid"});
    }
    //sysLogServerIPEu
    if(deviceSetting.sysLogServerIPEu != "" && !this.isIpOrWebsiteAllowHttp(deviceSetting.sysLogServerIPEu)) {
        result.push({status: false, reason: "error syslog server ip eu"});
    }
    //telnet
    if([0,1].indexOf(deviceSetting.telnet) == -1) {
        result.push({status: false, reason: "error telnet setting"});
    }
    //timeout
    if(['0', 0, 1, 2, 3, 4, 5].indexOf(deviceSetting.timeout) == -1) {
        result.push({status: false, reason: "error timeout"});
    }
    //userName
    if(!/^[0-9A-Za-z]{0,64}$/.test(deviceSetting.userName)) {
        result.push({status: false, reason: "error username"});
    }
    if(deviceSetting.ssh ==1 && deviceSetting.telnet==1) {
        result.push({status: false, reason: "error console setting"});
    }

    if (result.length > 0) {
        let msg = "";
        result.map((r => {
            msg += `${r.reason}; `;
            console.warn('device setting check error: ',r.reason);
        }))
        return {status: false, message: msg};
    } else {
        return {status: true, message: "success"};
    }
}

exports.checkPerformance = (performance) => {
    if(!performance) return false;
    let {band5,band24,secBand5,lan,subCfgID} = performance;
    if(typeof band5 == "undefined") return false;
    if(typeof band24 == "undefined") return false;
    if(typeof secBand5 == "undefined") return false;
    if(typeof lan == "undefined") return false;
    if(typeof subCfgID == "undefined") return false;
    let checkArr = {band5,band24,secBand5};
    for(let k in checkArr){
        let kObj = checkArr[k];
        //ackTimeout: 48
        if(k == "band24" && !/^(4[8-9]|[5-9]\d|1\d{2}|200)$/.test(kObj.ackTimeout)) return false;
        if(k != "band24" && !/^(2[5-9]|[3-9]\d|1\d{2}|200)$/.test(kObj.ackTimeout)) return false;
        //beaconInterval: 100
        if(!/^([1-4]\d{2}|500|[4-9]\d)$/.test(kObj.beaconInterval)) return false;
        //channelWidth: 2
        if( (k != "band24" && kObj.wirelessMode == 7) && [1,2,3].indexOf(kObj.channelWidth) == -1) return false;
        if(!(k != "band24" && kObj.wirelessMode == 7) && [1,2].indexOf(kObj.channelWidth) == -1) return false;
        //dataRate:
        if( k=="band24" && ["Auto","Best",  '1', '2', '5.5', '6', '9', '11', '12', '18', '24', '36', '48', '54'].indexOf(kObj.dataRate)==-1) return false;
        if( k!="band24" && ["Auto","Best",  '6', '9', '12', '18', '24', '36', '48', '54'].indexOf(kObj.dataRate)==-1) return false;
        //dhcptoUnicast: [0, 1]
        if([0,1].indexOf(kObj.dhcptoUnicast) == -1) return false;
        //dtimInterval: 
        if(!/^([1-9]|1[0-5])$/.test(kObj.dtimInterval)) return false;
        //fragmentLength: 
        if(!/^(2[0-2]\d{2}|23[0-3]\d|234[0-6]|1\d{3}|[3-9]\d{2}|2[6-9]\d|25[6-9])$/.test(kObj.fragmentLength)) return false;
        //ht2040Coexistence: [0, 1]
        if([0,1].indexOf(kObj.ht2040Coexistence) == -1) return false;
        //igmpSnooping: [0, 1]
        if([0,1].indexOf(kObj.igmpSnooping) == -1) return false;
        //maxMulticastBW: 0~1024
        if(!/^(10[0-1]\d|102[0-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/.test(kObj.maxMulticastBW)) return false;
        //multicastBWControl: 0
        if([0,1].indexOf(kObj.multicastBWControl) == -1) return false;
        //multicastRate: 
        if(k == "band24" && ['Disable', '1', '2', '5.5', '6', '9', '11', '12', '18', '24', '36', '48', '54'].indexOf(kObj.multicastRate) == -1) return false;
        if(k != "band24" && ['Disable', '6', '9', '12', '18', '24', '36', '48', '54'].indexOf(kObj.multicastRate) == -1) return false;
        //notShow: 
        if([true,false].indexOf(kObj.notShow) == -1) return false;
        //rtsLength: 256-2346
        if(!/^(2[0-2]\d{2}|23[0-3]\d|234[0-6]|1\d{3}|[3-9]\d{2}|2[6-9]\d|25[6-9])$/.test(kObj.rtsLength)) return false;
        //shortGI: [0,1]
        if([0,1].indexOf(kObj.shortGI) == -1) return false;
        //wirelessMode: [2,5,7]
        if([1,2,3,5,6,7].indexOf(kObj.wirelessMode) == -1) return false;
        //wirelessStatus: [0,1]
        if([0,1].indexOf(kObj.wirelessStatus) == -1) return false;
        //wmm: [0,1]
        if([0,1].indexOf(kObj.wmm) == -1) return false;
    }
    //lan lan.stp
    if(!lan || ["0",0,1].indexOf(lan.stp) == -1) return false;
    //subCfgID
    if(!(subCfgID >= 0)) return false;
    return true;
}

exports.checkWlanPartition = (wlanPartition) => {
    let {subCfgID,band5,band24,secBand5} = wlanPartition;
    if(typeof band5 == "undefined") return false;
    if(typeof band24 == "undefined") return false;
    if(typeof secBand5 == "undefined") return false;
    if(typeof subCfgID == "undefined") return false;
    let checkArr = {band5,band24,secBand5};
    for(let k in checkArr){
        let kObj = checkArr[k];
        // ethToWlan: 1
        // linkIntegrity: 0
        // multiSSID1: 0
        // multiSSID2: 2
        // multiSSID3: 1
        // multiSSID4: 1
        // multiSSID5: 0
        // multiSSID6: 2
        // multiSSID7: 1
        // primarySSID: 1
        for(let j in kObj){
            if(["ethToWlan","linkIntegrity"].indexOf(j) > -1){
                if(["0",0,1].indexOf(kObj[j]) == -1) return false;
            }else{
                if([0,1,2].indexOf(kObj[j]) == -1) return false;
            }
        }
    }
    //subCfgID
    if(!(subCfgID >= 0)) return false;
    return true;
}

exports.checkWirelessResource = (wirelessResource) => {
    let {band5,band24,secBand5,bandSteer,subCfgID,airtimeFairness} = wirelessResource;
    if(typeof band5 == "undefined") return false;
    if(typeof band24 == "undefined") return false;
    if(typeof secBand5 == "undefined") return false;
    if(typeof bandSteer == "undefined") return false;
    if(typeof airtimeFairness == "undefined") return false;
    if(typeof subCfgID == "undefined") return false;
    let checkArr = {band5,band24,secBand5};
    for(let k in checkArr){
        let kObj = checkArr[k];
        // aclRssi: [0,1]
        if([0,1].indexOf(kObj.aclRssi) == -1) return false;
        // aclRssiThreshod: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        if([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].indexOf(kObj.aclRssiThreshod) == -1) return false;
        // agingOut: [0, 1, 2]
        if([0, 1, 2].indexOf(kObj.agingOut) == -1) return false;
        // connectLimit: /^([1-5]\d|6[0-4]|\d)$/
        if(!/^([1-5]\d|6[0-4]|\d)$/.test(kObj.connectLimit)) return false;
        // dataRateThreshod: [6, 9, 12, 18, 24, 36, 48, 54]
        if([6, 9, 12, 18, 24, 36, 48, 54].indexOf(kObj.dataRateThreshod) == -1) return false;
        // networkUtilization: ['0', 20, 40, 60, 80, 100]
        if(['0', 0, 20, 40, 60, 80, 100].indexOf(kObj.networkUtilization) == -1) return false;
        // preferred11n: ['0', 0, 1]
        if(['0', 0, 1].indexOf(kObj.preferred11n) == -1) return false;
        // rssiThreshod: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
        if([10, 20, 30, 40, 50, 60, 70, 80, 90, 100].indexOf(kObj.rssiThreshod) == -1) return false;
        // userLimit: /^([1-5]\d|6[0-4]|\d)$/
        if(!/^([1-5]\d|6[0-4]|\d)$/.test(kObj.userLimit)) return false;
    }
    if([0,1].indexOf(airtimeFairness.status) == -1) return false;
    if([0,1].indexOf(bandSteer.status) == -1) return false;
    //subCfgID
    if(!(subCfgID >= 0)) return false;
    return true;
}

exports.checkSSID = (ssid) => {
    let serverRe = /^(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
    let gatewayRe = /^(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})(\.(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[0-9]{1,2})){3}$/;
    
    /**
     * 注意区别，前端是拆开验证，传到后端是合并后传入，所以校验规则有区别。
     * 后端校验是要求有http://或者https://开头，
     * 前端则是要求没有http://或者https://开头，
    */
    //let domainRe = /^(?!https?:\/\/)+([\w\-\.@?^=%&:;\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;
    let domainRe = /^(https?:\/\/)+([\w\-\.@?^=%&:;\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/;

    let domainHttpRe = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    let domainListRe = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    let portRe = /^([1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5]|[1-9]\d{3}|[1-9]\d{2}|[1-9]\d|[1-9])$/;
    let subMaskRe = /^(255)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)\.(1\d{2}|2[0-4]\d|25[0-5]|[1-9]\d|\d)$/;
    let vlanGroupRe = /^([1-3]\d{3}|40[1-8]\d|409[1-4]|[1-9]\d{2}|[1-9]\d|[1-9])$/;

    // IPIFDns:         ""  serverRe maxlength="15" 
    if(ssid.IPIFDns && !serverRe.test(ssid.IPIFDns)) return false;

    // IPIFGateway:     ""  gatewayRe maxlength="15" 
    if(ssid.IPIFGateway && !gatewayRe.test(ssid.IPIFGateway)) return false;

    // IPIFIpAddress:   ""  serverRe
    if(ssid.IPIFIpAddress && !serverRe.test(ssid.IPIFIpAddress)) return false;

    // IPIFIpFrom:      1   [1, 2]
    if([1,2].indexOf(ssid.IPIFIpFrom) == -1) return false;

    // IPIFMask:        ""  subMaskRe  maxlength="15"
    if(ssid.IPIFMask && !subMaskRe.test(ssid.IPIFMask)) return false;

    // IPIFStatus:      0   [0, 1] 
    if([0, 1].indexOf(ssid.IPIFStatus) == -1) return false;

    // IPIFVlanGroup:   1   vlanGroupRe  maxlength="4"
    if(ssid.IPIFVlanGroup && ssid.IPIFVlanGroup != 1 && !vlanGroupRe.test(ssid.IPIFVlanGroup)) return false;

    // LDAPAttribute:   ""  maxlength="64"
    if(ssid.LDAPAttribute && ssid.LDAPAttribute > 64) return false;

    // LDAPAuthMode:    0   ['0', 0, 1]
    if(['0', 0, 1].indexOf(ssid.LDAPAuthMode) == -1) return false;

    // LDAPAutoCopy:    0   [0,1]
    if([0, 1].indexOf(ssid.LDAPAutoCopy) == -1) return false;

    // LDAPBaseDN:      ""  maxlength="126"
    if(ssid.LDAPBaseDN && ssid.LDAPBaseDN > 126) return false;

    // LDAPIdentity:    ""  maxlength="256"
    if(ssid.LDAPIdentity && !ssid.LDAPIdentity.length > 256) return false;

    // LDAPPasswd:      ""  max-length="64"
    if(ssid.LDAPPasswd && !ssid.LDAPPasswd.length > 64) return false;

    // LDAPPort:        389   maxlength="5"
    if(!this.isPort(ssid.LDAPPort)) return false;

    // LDAPServer:      ""  
    if(ssid.LDAPServer != "" && !this.isIpOrWebsiteAllowHttp(ssid.LDAPServer)) return false;

    // LDAPUsername:    ""  maxlength="64"
    if(ssid.LDAPUsername && !ssid.LDAPUsername.length > 64) return false;

    // POP3ConnectType: 0   ['0', 0, 1]
    if(!['0', 0, 1].indexOf(ssid.POP3ConnectType) == -1) return false;

    // POP3Port:        110 portRe maxlength="5"
    if(!this.isPort(ssid.POP3Port)) return false;

    // POP3Server:      ""
    if(ssid.POP3Server != "" && !this.isIpOrWebsiteAllowHttp(ssid.POP3Server)) return false;

    // accountPort:     1813    maxlength="5"    -?- 1~65535
    if(!this.isPort(ssid.accountPort)) return false;

    // accountRadiusType: 0  ['0', 0, 1]
    if(!['0', 0, 1].indexOf(ssid.accountRadiusType) == -1) return false;

    // accountSecret:   ""  max-length="64" 
    if(ssid.accountSecret && !ssid.accountSecret.length > 64) return false;

    // accountServer:   ""  maxlength="15"
    if(ssid.accountServer && !ssid.accountServer.length > 15) return false;

    // accountStatus:   0   [0, 1]
    if(![0, 1].indexOf(ssid.accountStatus) == -1) return false;
    // authType:        0   ['0', 0, 1, 2, 4, 5, 6, 7, 8, 9, 11]
    if(!['0', 0, 1, 2, 4, 5, 6, 7, 8, 9, 11].indexOf(ssid.authType) == -1) return false;

    // authentication:  8   [1, 6, 7, 8, 9, 10]
    if(![1, 6, 7, 8, 9, 10].indexOf(ssid.authentication) == -1) return false;

    // backupAccountPort: 1813 portRe maxlength="5"
    if(!this.isPort(ssid.backupAccountPort)) return false;

    // backupAccountSecret: ""  max-length="64"
    if(ssid.backupAccountSecret && !ssid.backupAccountSecret.length > 64) return false;

    // backupAccountServer: ""  maxlength="15"
    if(ssid.backupAccountServer && !ssid.backupAccountServer.length > 15) return false;

    // backupRadiusPort: 1812  portRe maxlength="5"
    if(!this.isPort(ssid.backupRadiusPort)) return false;

    // backupRadiusSecret: ""  max-length="64"
    if(ssid.backupRadiusSecret && !ssid.backupRadiusSecret.length > 64) return false;

    // backupRadiusServer: ""  maxlength="15"
    if(ssid.backupRadiusServer && !ssid.backupRadiusServer.length > 15) return false;

    // band:            1   [1, 2, 3]
    if(![1, 2, 3].indexOf(ssid.band) == -1) return false;

    // broadcast:       1   [0, 1]
    if(![0, 1].indexOf(ssid.broadcast) == -1) return false;

    // characterSet:    1   [1, 2]
    if(![1, 2].indexOf(ssid.characterSet) == -1) return false;

    // cipherType:      1   [1, 2, 3]
    if(![1, 2, 3].indexOf(ssid.cipherType) == -1) return false;

    // ehpPath:         ""  maxlength="120"
    if(ssid.ehpPath && !ssid.ehpPath.length > 120) return false;

    // ehpScheme:       0   [0, 1]
    if(![0, 1].indexOf(ssid.ehpScheme) == -1) return false;

    // encryption:      0   [0, 1]
    if(![0, 1].indexOf(ssid.encryption) == -1) return false;

    // externalCaptPort: ""   domainRe  maxlength="120"
    if(ssid.externalCaptPort && !domainRe.test(ssid.externalCaptPort)) return false;

    // firstRadiusPort: 1812  固定值，暂不校验
    // firstRadiusSecret: ""  固定值，暂不校验
    // firstRadiusServer: ""  固定值，暂不校验
    // firstRadiusType: 0     固定值，暂不校验

    // groupKeyUpdateInterval: 3600 /^([3-9]\d{2}|[1-9]\d{3,6})$/ min-length="3" maxlength="7"
    if(!/^([3-9]\d{2}|[1-9]\d{3,6})$/.test(ssid.groupKeyUpdateInterval)) return false;

    // idleTimeout:     60  /^(1[0-3]\d{2}|14[0-3]\d|1440|[1-9]\d{1,2}|[2-9])$/  maxlength="4"
    if(!/^(1[0-3]\d{2}|14[0-3]\d|1440|[1-9]\d{1,2}|[2-9])$/.test(ssid.idleTimeout)) return false;

    // ipFilter: []  暂未校验 maxlength="15"

    // ipFilterStatus:  0   [0, 1]
    if(![0, 1].indexOf(ssid.ipFilterStatus) == -1) return false;

    // keyIndex:        1   [1, 2, 3, 4]  前端已注释，暂不校验

    // keySize:         0   ['0', 0, 1]
    if(!['0', 0, 1].indexOf(ssid.keySize) == -1) return false;

    // keyType:         2   [1, 2]
    if(![1, 2].indexOf(ssid.keyType) == -1) return false;

    // keyUpdateInterval: 300   /^([3-9]\d{2}|[1-9]\d{3,6})$/ min-length="3" maxlength="7"
    if(!/^([3-9]\d{2}|[1-9]\d{3,6})$/.test(ssid.keyUpdateInterval)) return false;

    // keyValue:        ""  前端根据keySize和keyType有两种情况 暂未校验

    // macAccessControl:3   [1, 2, 3]
    if(![1, 2, 3].indexOf(ssid.macAccessControl) == -1) return false;

    // macByPass:       []  maxlength="17" 暂未校验 placeholder="XX:XX:XX:XX:XX:XX" 
    
    // macList:         []  暂未校验

    // passPhrase: "be5f75d3f7772ebb8856ec51776363d2"  暂未校验 (特殊密码：64位16进制，或者小于64位的任意字符) min-length="8" max-length="64" /^[0-9A-Fa-f]{0,64}$/

    // primaryAccountPort: 1813   portRe maxlength="5"
    if(!this.isPort(ssid.primaryAccountPort)) return false;

    // primaryAccountSecret: ""   max-length="64"
    if(ssid.primaryAccountSecret && !ssid.primaryAccountSecret.length > 64) return false;

    // primaryAccountServer: ""   maxlength="15"
    if(ssid.primaryAccountServer && !ssid.primaryAccountServer.length > 15) return false;

    // primaryAccountStatus: 0    [0, 1]
    if(![0, 1].indexOf(ssid.primaryAccountStatus) == -1) return false;

    // primaryRadiusPort: 1812    portRe maxlength="5"
    if(!this.isPort(ssid.primaryRadiusPort)) return false;

    // primaryRadiusSecret: ""    max-length="64"
    if(ssid.primaryRadiusSecret && !ssid.primaryRadiusSecret.length > 64) return false;

    // primaryRadiusServer: ""    maxlength="15"
    if(ssid.primaryRadiusServer && !ssid.primaryRadiusServer.length > 15) return false;

    // radiusPort: 1812           portRe  maxlength="5"
    if(!this.isPort(ssid.radiusPort)) return false;

    // radiusSecret:        ""    max-length="64"
    if(ssid.radiusSecret && !ssid.radiusSecret.length > 64) return false;
    
    // radiusServer:        ""    maxlength="15"
    if(ssid.radiusServer && !ssid.radiusServer.length > 15) return false;
    
    // radiusType:           0    ['0', 0, 1]
    if(!['0', 0, 1].indexOf(ssid.radiusType) == -1) return false;

    // secondRadiusPort:    1812  固定值，暂不校验
    // secondRadiusSecret:  ""    固定值，暂不校验
    // secondRadiusServer:  ""    固定值，暂不校验
    // secondRadiusType:     0    固定值，暂不校验

    // sessionTime:         120   /^(1[0-3]\d{2}|14[0-3]\d|1440|[1-9]\d{0,2})$/  maxlength="4"
    if(!/^(1[0-3]\d{2}|14[0-3]\d|1440|[1-9]\d{0,2})$/.test(ssid.sessionTime)) return false;

    // splashPageCustom:    "pages_default.tar"    暂不校验？

    // ssid:                "dlink11"  /^[A-Za-z0-9_.,;:?\[\]<>/\*{}^\|()@#$+=%!\s-]+$/ minlength="1" maxlength="32" 
    if(!/^[A-Za-z0-9_.,;:?\[\]<>/\*{}^\|()@#$+=%!\s-]+$/.test(ssid.ssid) || ssid.ssid.length < 1 || ssid.ssid.length > 32) return false;
    
    // ssidIndex:            1    [1, 2, 3, 4, 5, 6, 7, 8]
    if(![1, 2, 3, 4, 5, 6, 7, 8].indexOf(ssid.ssidIndex) == -1) return false;

    // subCfgIDMacACL:       0    未发现任何相关，暂不处理

    // thirdRadiusPort:     1812  固定值，暂不校验
    // thirdRadiusSecret:   ""    固定值，暂不校验
    // thirdRadiusServer:   ""    固定值，暂不校验
    // thirdRadiusType:      0    固定值，暂不校验
    // userPwd:             []    暂未校验？
    // walledGarden:        []    暂未校验？

    // webRedirectState:     0    [0,1]?[0,1,true,false]
    if([0,1,true,false].indexOf(ssid.webRedirectState) == -1) return false;

    // webRedirectUrl:      ""    domainRe 或不校验  maxlength="120"
    if(ssid.webRedirectUrl && !domainRe.test(ssid.webRedirectUrl)) return false;

    // whitelistStatus:      0    [0,1]?[0,1,true,false]
    if([0,1,true,false].indexOf(ssid.whitelistStatus) == -1) return false;

    // wlanId:              10    未找到代码，暂未校验

    // wmm:                  1    [0, 1]
    if([0,1].indexOf(ssid.wmm) == -1) return false;
    
    return true;
}