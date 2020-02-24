/**
 * Created by lizhimin on 10/14/16.
 */
var assert = require("assert");
var app = require('../app');
var request = require('supertest')(app);
var should = require("should");
/*describe('getAllSensorItems',function(){
    it('should return all sensor that sp1 supported',function(done){

        request.get('/api/trigger/getAllSensorItems')
            .end(function(err,res){
                should.not.exists(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);

                done();
            })
    })
})*/
describe('getTriggersByDeviceModule',function(){
    it('should return all sensor that sp1 supported',function(done){
        request.post('/api/trigger/getTriggersByDeviceModule').send({orgId:'5833ed2b94b9396bf638df8e',module:{moduleType:'DWS-3160-24PC',soid:'1.3.6.1.4.1.171.11.124.2'}})
            .end(function(err,res){
                should.not.exists(err);
             //   assert.equal(res.body.success, true);
                console.log("triggers:"+JSON.stringify(res.body.data));
                done();
            })
    })
})