/**
 * Created by lzSob on 18/4/23.
 */
const fs = require('fs')
const rp = require('request-promise')
const crypto = require('crypto')

/**
 * url: 验证license api地址
 * key: '本地加密密钥'
 * timeUrl: 时间服务器
 * EXPIRE: 有效期
 * originCheck: 是否开启远端验证, 本版本不开启
 */
const uri = 'http://registration.dlink.com.tw:333/keycheck/v1/cwm/validate'
const key = '9cd5b4cfa1048596'
const iv = 'e6db271db12d4d47'
const EXPIRE =  30 * 24 * 60 * 60  //单位秒
const originCheck = false


/***
 * 简单的对称加密
 */
const enLicense = (str) => {
    let cipher = crypto.createCipheriv( 'aes-128-cbc', key, iv )
    let crypted = cipher.update(str, 'utf8', 'binary')
    crypted += cipher.final('binary')
    crypted = new Buffer( crypted, 'binary' ).toString('base64')
    return crypted
}

const deLicense = (str) => {
    let crypted = new Buffer( str, 'base64' ).toString('binary')
    let decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    let decoded = decipher.update( crypted, 'binary', 'utf8' )
    decoded += decipher.final('utf8')
    return decoded
}
/**
 * 获取服务器端的时间
 */
//const getServerTime = () => {
//    rp.options( url )
//        .then((res) => {
//            return res.head.date
//        })
//        .catch((err) => {
//            return  null
//        })
//}

module.exports = {
    /***
     * 验证license
     * @param req "{ lk=>licensekey ac=>active key  ma=> mac address }"
     * @param res
     * @param next
     */
    checkLicenseOrigin: (req, res, next) => {
        const { lk, ac, ma } = req.body
        if( !lk || !ac || !ma ){
            return res.json({success: false, error: 'lk ma ac be required'})
        }
        if(lk === 'cwm' && ac === 'cwm' && ma === 'cwm') { //开发跳过逻辑
            return res.json({success: true, data: 1})
        }
        const options = {
            method: 'POST',
            uri,
            body: {
                lk,
                ma,
                ac
            },
            json: true,
            resolveWithFullResponse: true
        }
        rp(options)
            .then((response) => {
                const { body } = response
                if(body === -1){
                    return res.json({success: false, msg: 'Server Error'})
                }
                if(body === 1){
                    //todo create or update file
                    //todo ...
                    const serverTime = new Date(response.headers.date).getTime().toString()
                    const jsonData = {
                        ma,
                        lk,
                        ac,
                        serverTime
                    }
                    if(!fs.existsSync(`/userdata/config/customer/`))fs.mkdirSync(`/userdata/config/customer/`)
                    if(!fs.existsSync(`/userdata/config/customer/user/`))fs.mkdirSync(`/userdata/config/customer/user/`)
                    if(!fs.existsSync(`/userdata/config/customer/user/tmp/`))fs.mkdirSync(`/userdata/config/customer/user/tmp/`)
                    fs.writeFileSync(`/userdata/config/customer/license.txt`, enLicense(JSON.stringify(jsonData)))
                    fs.writeFileSync(`/userdata/config/customer/user/tmp/.ma`, enLicense(ma))
                    fs.writeFileSync(`/userdata/config/customer/user/tmp/.lk`, enLicense(lk))
                    fs.writeFileSync(`/userdata/config/customer/user/tmp/.ac`, enLicense(ac))
                    fs.writeFileSync(`/userdata/config/customer/user/tmp/.tm`, enLicense(serverTime))
                    return res.json({success: true, data: body})
                }
                if(body === -2){
                    return res.json({success:false, msg: 'LN、MAC与AC不一致'})
                }
                if(body === -3){
                    return res.json({success:false, msg: 'LN、AC或MAC不存在'})
                }
                else {
                    return res.json({success: false, msg: '未知错误'})
                }
            })
            .catch((err) => {
                // console.log(err)
                return res.json({success: false, msg: '网络错误', err: err})
            })
    },
    checkLicense: ( req, res, next ) => {
        if( !fs.existsSync(`/userdata/config/customer/license.txt`) ||
            !fs.existsSync(`/userdata/config/customer/user/tmp/.ma`) ||
            !fs.existsSync(`/userdata/config/customer/user/tmp/.lk`) ||
            !fs.existsSync(`/userdata/config/customer/user/tmp/.ac`) ||
            !fs.existsSync(`/userdata/config/customer/user/tmp/.tm`)) {
            return res.json({success: false, msg: ''})
        }
        const str = fs.readFileSync(`/userdata/config/customer/license.txt`, 'utf-8')
        const en_lk = fs.readFileSync(`/userdata/config/customer/user/tmp/.lk`, 'utf-8')
        const en_ac = fs.readFileSync(`/userdata/config/customer/user/tmp/.ac`, 'utf-8')
        const en_ma = fs.readFileSync(`/userdata/config/customer/user/tmp/.ma`, 'utf-8')
        const en_serverTime = fs.readFileSync(`/userdata/config/customer/user/tmp/.tm`, 'utf-8')

        let licenseInfo
        let lk
        let ac
        let ma
        let serverTime
        try {
             licenseInfo = deLicense(str)
             lk = deLicense(en_lk)
             ac = deLicense(en_ac)
             ma = deLicense(en_ma)
             serverTime = deLicense(en_serverTime)
        }catch (err) {
            console.log(err)
            return res.json({success: false, msg: ''})
        }
        const jsonData = {
            ma,
            lk,
            ac,
            serverTime
        }
        if(licenseInfo !== JSON.stringify(jsonData)){
            return res.json({success: false, msg: ''})
        }

        if(originCheck) {
            const serverTime = getServerTime()
            if( serverTime - Number(licenseInfo.serverTime) > EXPIRE || serverTime - licenseInfo.serverTime > EXPIRE * 2){
                return res.json({success: false, msg: ''})
            }
        }
        return res.json({success: true, data: 1})
    }

}