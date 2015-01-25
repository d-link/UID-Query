var mysql     = require('mysql');
var env       = process.env.NODE_ENV || "development";
var config    = require(__dirname + '/../config/database.json')[env];
var pool = mysql.createPool({
  connectionLimit : 5,
  host     : config.host,
  user     : config.username,
  password : config.password,
  port     : config.port,
  database : config.database
});


exports.getDeviceLog = function(uid, callback) {
  // Remove all dashes in uid
  uid = uid.replace(/-/g, '');

      pool.getConnection(function(err, connection) {
        if (err) {
          console.error('error connecting: ' + err.stack);
          return;
        }

      console.log('connected as id ' + connection.threadId);

      var sql = "SELECT device_log.device_id AS uid, organization.name AS organization_id, device_log.state, device_log.last_update AS time FROM device_log, organization WHERE device_log.organization_id = organization.id AND device_log.device_id = ?";
      var sql_param = uid;
console.log(sql_param);

      connection.query(sql, sql_param, function(err, results) {
        if(err) { throw err; }

        // Convert the Objects array to array which need for datatable
        var dataArray = [];
        for (i = 0; i < results.length; i++) {
          var array = [];
          for (var key in results[i]) {
            array.push(results[i][key]);
          } 
          dataArray.push(array);
        }

        var json = JSON.stringify({ data: dataArray });

        callback(json);

        connection.release();

      });

    });
};

//getDeviceLog('TESTTF100010', function(json) {
//    console.log(json);
//});
