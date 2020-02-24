/**
 * Created by lizhimin on 2016/5/3.
 */
'use strict';
const util = require("../lib/util");
const mailer = util.common.mailer;

function getHtmlBody(user, validCode) {
    const msg1 = 'We received a request to reset the password associated with this e-mail address. ';
    const msg2 = `Your Captcha is :`;
    const msg3 = 'If you did not request to have your password reset you can safely ignore this email. Rest assured your customer account is safe.';
    const msg4 = 'Nuclias Connect';
    const user1 = user;
    const validCode1 = validCode;
    const htmlbody =
        `
       <html style="100%;height:100%"><body  style="100%;height:100%;margin:0;background-color:#f5f5f5;font-family:Roboto;font-weight:300;">
        <div style="width:100%;height:100%;background-color:#f5f5f5;position:absolute;top:0px;left:0px;">
       <h1 style="width:600px;margin:0px auto 24px;padding-top:40px;line-height:1;"><span style="position:relative;top:2px;font-weight:normal;font-size:18px;color:#888;margin-left:16px;">${msg4}</span></h1>
       <p style="width:552px;margin:0px auto;padding:24px;background-color:#fff;box-shadow:0px 1px 3px rgba(0,0,0,.16);border-radius:4px;font-size:14px">
      <span
        style="display:block;padding:0px 8px;margin-bottom:16px;margin-top:24px;line-height:24px;color:#999;">Dear <i
        style="font-style:normal;color:#444444;">${ user1 }</i></span><span
        style="display:block;padding:0px 8px;margin-bottom:16px;line-height:24px;color:#999;">${ msg1 }</span><span
        style="display:block;padding:0px 8px;margin-bottom:16px;line-height:24px;font-size:16px;color:#999;">${msg2} <b
        style="font-style:normal;font-size:24px;color:#fb8c00;font-weight:300;">${validCode1}</b></span><span
        style="display:block;padding:0px 8px;line-height:24px;color:#999;">${msg3}</span><span
        style="display:block;padding:0px 8px;margin-top:100px;margin-bottom:0px;line-height:24px;color:#999;">Nuclias Connect Team</span>
</p>
<p style="width:600px;margin:16px auto 40px;font-size:12px;color:#999;text-align:center;">&copy;2020 D-Link Corporation</p></div>
</body></html>
`;
    return htmlbody;
}
exports.sendTestMail = function (server, toEmail, callback) {
    let subject = "Test Email";
    let htmlBody = "This is a test email from Nuclias Connect.";
    let option = {
        displayName: server.displayName,
        to: toEmail,
        encoding: server.encoding,
        subject: subject,
        html: htmlBody
    }
    if(!server.auth||!server.auth.user){
        delete server.auth;
    }
    mailer.sendEmail(option, server, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
};
exports.sendResetPassMail = function (username,toEmail, validCode,server, callback) {

    let subject = "Reset your password";
    let htmlBody = getHtmlBody(username, validCode);
    let smtpserver={};
    if(server&&server.port&&server.host){
        smtpserver={
            secure:server.secure,
            host:server.host,
            port:server.port,
            encoding:server.encoding,
            displayName:server.displayName
        }
        if(server.auth&&server.auth.username){
            smtpserver.auth={
                user:server.auth.username,pass:server.auth.password
            }
        }

    }else{
        return callback("invalid host");
    }
    smtpserver.auth.type="login";
    let option = {
        displayName: smtpserver.displayName,
        to: toEmail,
        encoding: smtpserver.encoding,
        subject: subject,
        html: htmlBody
    };
    mailer.sendEmail(option, smtpserver, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
};

