var path = require('path');
var express = require('express');
var router = express.Router();

router.get('/cwmSite',function(req,res){
   /* var html = path.normalize(__dirname + '/../../website1/snmpSite/index.html');
     res.sendfile(html);*/
    res.redirect("https://www.baidu.com");
    res.end();
});
router.get('/snmpSite',function(req,res){
   /* var html = path.normalize(__dirname + '/../../website1/snmpSite/index.html');
    res.sendfile(html);*/
    res.redirect("/snmpSite");
})
module.exports = router;