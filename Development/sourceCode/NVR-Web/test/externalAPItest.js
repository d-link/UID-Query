/**
 * Created by lizhimin on 2018/9/19.
 */

var assert = require("assert");
var app = require('../app');
var request = require('supertest')(app);
/*let https = require('https');
const url = require('url');*/
let key="tnn3EIX3+0cVYgKmXcyuzJfs0w1Jeu9EUkx2a+xqyhw=";//REST API KEY
let webUrl="/external/api/v1";
let schoolId=123456;    //schooldId参数
describe('getAllSchoolItems', function() {
    it('should back All school items', function(done) {
        let url=webUrl+'/getAllSchoolItems';
        request.get(url)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('getAPInfobySchoolId', function() {
    it('should back All AP Information by schoolId', function(done) {
        request.get(webUrl+'/getAPInfobySchoolId?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(JSON.stringify(res.body.data));
                done();
            });
    });

});
describe('getClientCountBySchoolId', function() {
    it('should back All Client Count by School ID', function(done) {
        request.get(webUrl+'/getClientCountBySchoolId?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});

describe('GetAPAndClientCountBySchoolId', function() {
    it('should back All AP MAC and Client Count by School ID', function(done) {
        request.get(webUrl+'/GetAPAndClientCountBySchoolId?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});

describe('GetClientCountByAPMAC', function() {
    it('should back  Client Count by AP MAC', function(done) {
        request.get(webUrl+'/GetClientCountByAPMAC?apMAC=40:9b:cd:0c:69:50')
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('GetTotalClientCount', function() {
    it('should back Total Client Count', function(done) {
        request.get(webUrl+'/GetTotalClientCount')
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('GetClientInfoBySchoolId', function() {
    it('should back All Client Information by School ID', function(done) {
        request.get(webUrl+'/GetClientInfoBySchoolId?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(JSON.stringify(res.body.data));
                done();
            });
    });

});
describe('GetAllSuppliers', function() {
    it('should back All Suppliers', function(done) {
        request.get(webUrl+'/GetAllSuppliers')
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('GetSSID4SecurityBySchoolId', function() {
    it('should back ssid 4 security passphrase by schoolId', function(done) {
        request.get(webUrl+'/GetSSID4SecurityBySchoolId?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('SetSSID4SecurityBySchoolId', function() {
    it('should set ssid 4 security passphrase by schoolId', function(done) {
        request.post(webUrl+'/SetSSID4SecurityBySchoolId')
            .set('Authorization', 'Token ' + key)
            .send({
                schoolId: schoolId,
                passphrase:'dlink656'
            })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.success);
                done();
            });
    });

});
describe('ApplyNetworkProfile', function() {
    it('should apply network profile immediate', function(done) {
        request.get(webUrl+'/ApplyNetworkProfile?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('GetAPCountBySchoolId', function() {
    it('should back ap count info by schoolId', function(done) {
        request.get(webUrl+'/GetAPCountBySchoolId?schoolId='+schoolId)
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});
describe('GetTotalAPCount', function() {
    it('should back all ap count in system', function(done) {
        request.get(webUrl+'/GetTotalAPCount')
            .set('Authorization', 'Token ' + key)
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                //should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});