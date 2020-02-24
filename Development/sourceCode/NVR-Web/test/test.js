const crypto = require('crypto');

function aesEncrypt(data, key) {
  const cipher = crypto.createCipher('aes192', key);
  var crypted = cipher.update(data, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function aesDecrypt(encrypted, key) {
  const decipher = crypto.createDecipher('aes192', key);
  var decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

var data = 'cwmdlink';
var key = 'AEFTUOJUKM087';
var encrypted = aesEncrypt(data, key);
var decrypted = aesDecrypt(encrypted, key);

console.log('Plain text: ' + data);
console.log('Encrypted text: ' + encrypted);
console.log('Decrypted text: ' + decrypted);
var fs = require('fs');
let https = require('https');
var ca = fs.readFileSync('cwmca-cert.pem');

let telst=`/api/v1/file/5bf3762e46de405ce02b0c29/dap2680_v2.00_ibdh_debug_1113.bin`;

var options = {
  hostname:'localhost',
  port:8443,
  path: telst,
  method:'GET'
};
options.agent = new https.Agent(options);
    function fwdownload(){
      https.request(options, function (res) {
        res.on('data', function (buff) {
          try {
            var result = buff.toString();
            console.log("******fw file: "+result);
          } catch (e) {
            console.log("request %s failed:");
          }
        });
        res.on("end", function () {
          console.log("******UpdateModules****" + "end");
        });
      }).on("error", function (err) {
        console.log("*******UpdateModules*****Error:" + err);
      });
    }
    for(let i=0;i<50;i++){
      fwdownload();
    }