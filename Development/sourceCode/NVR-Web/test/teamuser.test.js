/**
 * Created by lizhimin on 2016/7/5.
 */
var assert = require("assert");
var app = require('../app');
var request = require('supertest')(app);
var should = require("should");
describe('register', function() {
    it('should back user right', function(done) {
        request.post('/api/team/listUserByTag')
            .send({
                orgId: '577b20de7ae47ec0331f81b1',
                tagId:1
            })
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                should.not.exist(err);
                assert.equal(res.body.success, true);
                console.log(res.body.data);
                done();
            });
    });

});