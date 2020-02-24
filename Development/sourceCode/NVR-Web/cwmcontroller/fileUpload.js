/**
 * Created by lizhimin on 2016/2/2.
 */
'use strict';
const fs = require('fs');
var customerDir = `/userdata/config/customer`;
function createCustomerDic() {
    if (!fs.existsSync(customerDir)) {
        fs.mkdirSync(customerDir);
    }
};

exports.uploadFile = function (req, callback) {
    createCustomerDic();
    let fields = req.body;
    let files = req.files;
    if (files.file && files.file.length > 0) {
        let inputFile = files.file;
        let uploadedPath = inputFile.path;
        let dstPath = `${customerDir}/${inputFile.originalFilename}`;
        //重命名为真实文件名
        var readStream = fs.createReadStream(uploadedPath);
        var writeStream = fs.createWriteStream(dstPath);
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            //fs.unlinkSync(uploadedPath);
            callback(null, dstPath, fields);
        });
    }
};

exports.uploadCertificateFile = function (inputFile, callback) {
    let configDir = '/userdata/config';
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }
    configDir = '/userdata/config/key';
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    let uploadedPath = inputFile.path;
    let dstPath = `/userdata/config/key/${inputFile.originalFilename}`;

    var readStream = fs.createReadStream(uploadedPath);
    var writeStream = fs.createWriteStream(dstPath);
    readStream.pipe(writeStream);
    readStream.on('end', function () {
        //fs.unlinkSync(uploadedPath);
        callback(null, dstPath);
    });

};

exports.uploadLogo = function (req, res, oid, callback) {
    createCustomerDic();
    let fields = req.body;
    let files = req.files;
    if (files.file) {
        let inputFile = files.file;
        let uploadedPath = inputFile.path;
        let dstPath = customerDir+'/' + inputFile.originalFilename;
        if (fields.type == 'org') {
            let index = inputFile.originalFilename.lastIndexOf('.');
            let extension = inputFile.originalFilename.substring(index);
            let dstDir =  customerDir+'/logo';
            if (!fs.existsSync(dstDir)) {
                fs.mkdirSync(dstDir);
            }
            if (fields.orgId) {
                dstPath = dstDir + "/" + fields.orgId + extension;
            } else {
                dstPath = dstDir + "/" + oid + extension;
            }

        }
        //重命名为真实文件名
        var readStream = fs.createReadStream(uploadedPath);
        var writeStream = fs.createWriteStream(dstPath);
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            //fs.unlinkSync(uploadedPath);
            let org = {};
            org._id = fields.orgId ? fields.orgId : oid;
            org.name = fields.name;
            org.logo = dstPath.substring(1);
            org.keepAlive = fields.keepAlive;
            if (fields.userId) {
                callback(null, {org: org, userId: fields.userId});
            } else {

                callback(null, {org: org});
            }
        });
    } else {
        let org = {name: fields.name};
        org.logo = '';
        org._id = fields.orgId ? fields.orgId : oid;
        org.keepAlive = fields.keepAlive;
        if (fields.userId) {
            callback(null, {org: org, userId: fields.userId});
        } else {
            callback(null, {org: org});
        }
    }
};
exports.uploadPhoto = function (req, res, callback) {
    createCustomerDic();
    let fields = req.body;
    let files = req.files;
    if (!files.file) return callback(null, {});
    let inputFile = files.file;
    let uploadedPath = inputFile.path;
    let dstPath = customerDir+ '/' + inputFile.originalFilename;
    if (fields.type == 'user') {
        let index = inputFile.originalFilename.lastIndexOf('.');
        let extension = inputFile.originalFilename.substring(index);
        let dstDir = customerDir+ '/user';
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir);
        }

        dstPath = dstDir + "/" + fields.userId + extension;
    }
    //重命名为真实文件名

    var readStream = fs.createReadStream(uploadedPath);
    var writeStream = fs.createWriteStream(dstPath);
    readStream.pipe(writeStream);
    readStream.on('end', function () {
        //fs.unlinkSync(uploadedPath);
        callback(null, {userId: fields.userId, photo: dstPath.substring(1)});
    });
};

exports.uploadCustomizedLogo = function (req, res, oid, callback) {
    createCustomerDic();

    let files = req.files;
    if (files.file) {
        let inputFile = files.file;
        let uploadedPath = inputFile.path;
        let dstPath =  customerDir+'/' + inputFile.originalFilename;

        let index = inputFile.originalFilename.lastIndexOf('.');
        let extension = inputFile.originalFilename.substring(index);
        let dstDir =  customerDir+'/logo';
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir);
        }
        dstPath = dstDir + "/" + req.body.orgId + extension;

        //重命名为真实文件名
        var readStream = fs.createReadStream(uploadedPath);
        var writeStream = fs.createWriteStream(dstPath);
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            //fs.unlinkSync(uploadedPath);
            callback(null, dstPath.substring(1));
        });
    } else {
        callback(null, '');
    }
};
exports.uploadHotApMapsPic = function (files, callback) {
    createCustomerDic();
    let fileNname = new Date().getTime();
    if (files.file) {
        let inputFile = files.file;
        let uploadedPath = inputFile.path;
        let dstPath = customerDir+ '/' + inputFile.originalFilename;

        let index = inputFile.originalFilename.lastIndexOf('.');
        let extension = inputFile.originalFilename.substring(index);
        let dstDir =  customerDir+'/hotApMaps';
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir);
        }
        dstPath = dstDir + "/" + fileNname + extension;

        //重命名为真实文件名
        var readStream = fs.createReadStream(uploadedPath);
        var writeStream = fs.createWriteStream(dstPath);
        readStream.pipe(writeStream);
        readStream.on('end', function () {
            //fs.unlinkSync(uploadedPath);
            callback({result: dstPath.substring(1)});
        });
    } else {
        callback({result: ''});
    }
};