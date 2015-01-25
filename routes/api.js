var express = require('express');
var router = express.Router();

var device = require('../models/device');

router.get('/uid', function(req, res) {
  var json = JSON.parse('[]');
  res.json(json);
});

router.get('/uid/:uid', function(req, res) {
  var uid = req.params.uid;
  console.log("Query UID: " + uid);
  if (uid) {
    device.getDeviceLog(uid, function(data) {
      var json = JSON.parse(data);
      //var json = JSON.stringify(data);
      res.json(json);
    });
  } else {
    res.json(null);
  }

});

module.exports = router;
