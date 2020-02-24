/**
 * Created by lizhimin on 10/31/16.
 */
'use strict';
const _ = require("underscore");

function ip2int(ipAddress) {
    let num = 0;
    ipAddress = ipAddress.split(".");
    num = Number(ipAddress[0]) * 256 * 256 * 256 + Number(ipAddress[1]) * 256 * 256 + Number(ipAddress[2]) * 256 + Number(ipAddress[3]);
    num = num >>> 0;
    return num;
}
function int2ip(ip) {
    let str;
    let tt = new Array();
    tt[0] = (ip >>> 24) >>> 0;
    tt[1] = ((ip << 8) >>> 24) >>> 0;
    tt[2] = (ip << 16) >>> 24;
    tt[3] = (ip << 24) >>> 24;
    str = String(tt[0]) + "." + String(tt[1]) + "." + String(tt[2]) + "." + String(tt[3]);
    return str;
}

function isIpv4LoopbackAddress(ip) {
    return (ip & 0xFF000000) == 0x7F000000;//127.x.x.x
}

function isIpv4MulticastAddress(ip) {
    return (ip >= 0xE0000000) && (ip < 0xF0000000);//224.0.0.0~239.255.255.255
}

function isIPv4BroadcastAddress(ip) {
    if (isIpv4LoopbackAddress(ip)) {//loopback
        return false;
    } else if (ip >= 0xE0000000) {//multicast and reserved ip
        return false;
    } else if ((ip < 0x7F000000) && ((ip & 0x00FFFFFF) == 0x00FFFFFF)) {//A
        return true;
    } else if ((ip < 0xC0000000) && ((ip & 0x0000FFFF) == 0x0000FFFF)) {//B
        return true;
    } else if ((ip < 0xE0000000) && ((ip & 0x000000FF) == 0x000000FF)) {//C
        return true;
    }
    return false;//unicast
}

function getNextValidUcastip(ip) {
    let ipNext = ip + 1;
    if (isIpv4LoopbackAddress(ipNext)) {//loop-back address
        ipNext = 0x80000001;//128.0.0.1
    }
    if ((ipNext < 0x01000001) || (ipNext >= 0xE0000000)) {//multicast or reserved
        ipNext = 0x01000001;//1.0.0.1
    } else if ((ipNext < 0x7F000000) && ((ipNext & 0x00FFFFFF) == 0x00FFFFFF)) {//A
        ipNext = ipNext + 2;
    } else if ((ipNext < 0xC0000000) && ((ipNext & 0x0000FFFF) == 0x0000FFFF)) {//B
        ipNext = ipNext + 2;
    } else if ((ipNext < 0xE0000000) && ((ipNext & 0x000000FF) == 0x000000FF)) {//C
        ipNext = ipNext + 2;
    }
    return ipNext;
}

function addIpRangeV4(from, to) {
    let retJson = {
        retCode: false,
        ipSets: []
    };
    let fromIp = ip2int(from);
    let toIp = ip2int(to);
    if ((fromIp == 0x00000000 || fromIp == 0xffffffff) || (toIp == 0x00000000 || toIp == 0xffffffff)) {
        retJson.retCode = false;
        return retJson;
    }
    if (fromIp > toIp) {
        retJson.retCode = false;
        return retJson;
    }
    if (fromIp >= 0xE0000000) {
        retJson.retCode = false;
        return retJson;
    }
    if (fromIp < 0x01000001) {
        fromIp = 0x01000001;
    }
    if (toIp >= 0xE0000000) {
        toIp = 0xE0000000 - 1;
    }
    while (fromIp <= toIp) {
        if (isIpv4LoopbackAddress(fromIp) || isIPv4BroadcastAddress((fromIp))) {
            fromIp = getNextValidUcastip(fromIp);
            continue;
        }
        retJson.ipSets.push(int2ip(fromIp));
        fromIp = getNextValidUcastip(fromIp);
    }
    retJson.retCode = true;
    return retJson;
}

function addIpSubnetV4(ipSubnet) {
    let index = ipSubnet.indexOf("/");
    if (index == -1) {
        return false;
    }
    let subnetIp = ipSubnet.substr(0, index);
    let subnetMask = ipSubnet.substr(index + 1);
    let uMask = 1;
    uMask <<= (32 - subnetMask);
    uMask--;
    uMask = ~uMask;
    let startIp = ip2int(subnetIp);
    let fromIp = startIp & uMask;
    fromIp = int2ip(fromIp + 1);
    let toIp = startIp | ~uMask;
    toIp = int2ip(toIp - 1);
    return addIpRangeV4(fromIp, toIp);
}
function rangeIsIntersection(ipRange){
    let input=[];
    ipRange.forEach((_range)=>{
        if(_range.hasOwnProperty('range')){
            input.push(addIpRangeV4(_range.range.from,_range.range.to));
        }
        if(_range.hasOwnProperty('subnet')){
            input.push(addIpSubnetV4(_range.subnet));
        }

    });
    let result=_.intersection(input);
    if(result.length>0){
        return true;
    }
    return false;
}
function rangesAreIntersection(iprange,ipRanges){
    let input=[];
    ipRange.forEach((_range)=>{
        if(_range.hasOwnProperty('range')){
            input.push(addIpRangeV4(_range.range.from,_range.range.to));
        }
        if(_range.hasOwnProperty('subnet')){
            input.push(addIpSubnetV4(_range.subnet));
        }
    });
    ipRanges.forEach((_ipRange)=>{
        _ipRange.forEach((_range)=>{
            if(_range.hasOwnProperty('range')){
                input.push(addIpRangeV4(_range.range.from,_range.range.to));
            }
            if(_range.hasOwnProperty('subnet')){
                input.push(addIpSubnetV4(_range.subnet));
            }
        })
    })
    let result=_.intersection(input);
    if(result.length>0){
        return true;
    }
    return false;
}
module.exports.addIpRangeV4 = addIpRangeV4;
module.exports.addIpSubnetV4 = addIpSubnetV4;
module.exports.rangeIsIntersection = rangeIsIntersection;
module.exports.rangesAreIntersection = rangesAreIntersection;