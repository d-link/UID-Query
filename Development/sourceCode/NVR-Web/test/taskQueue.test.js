/**
 * Created by lizhimin on 2016/8/19.
 */
'use strict';
var assert = require("assert");
var app = require('../app');
var request = require('supertest')(app);
var should = require("should");
let taskQueue=require("../controller/taskQueue");
const common = require("../lib/util").common;
describe('addQueue', function () {
    //users.push(user);
    it('should add one document', function (done) {
        taskQueue.addQueue({manage: common.taskType.manage.addManageDevs},
            {_id:'579b25bc3874f9c0619b3258',devIds:['579b25bc3874f9c0619b325d']});
        done();
    });
});
describe('addQueueBatch', function () {
    //users.push(user);
    it('should add Array document', function (done) {
        taskQueue.addQueueBatch({manage: common.taskType.manage.removeManagedDevs},
            [{_id:'579b25bc3874f9c0619b3258',devIds:['579b25bc3874f9c0619b325d','579b25bc3874f9c0619b325e']},
                {_id:'5799b2bdbc3f09c413e1174e',devIds:['5799b2bdbc3f09c413e11751']}]);
        done();
    });
});
