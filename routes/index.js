var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title: 'UID Query System' });
});

/*
app.get('/', 
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    res.render('index', { title: 'UID Query System' });
  });
*/

module.exports = router;
