/**
 * Created by lizhimin on 2016/7/27.
 */
var assert = require("assert");
var app = require('../app');
var request = require('supertest')(app);
var should = require("should");

describe('listDeviceByType',function(){
    it('should list device',function(done){

        request.post('/api/device/listType').send({manageType:'new',networkId:'5788719dc39c83d43e1eebbf'})
            .expect(200)
            .end(function(err,res){
                should.not.exists(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            })
    })
});