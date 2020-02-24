const express = require('express');
const path = require('path');
const fs = require('fs');
/*var expressJwt = require('express-jwt');*/
const crypto = require('crypto');
//const unless = require('express-unless');
const logger = require('morgan');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
let configPath = path.resolve(path.join(process.cwd(), './config/appconfig.json'));
var systemconfig = require(configPath);
let logConfigPath = path.resolve(path.join(process.cwd(), './config/logConfig.json'));
let logCfg = require(logConfigPath);
const filePathFilter = require("./middleware/filePathFilter");
const util = require("./lib/util");
const systemCli = util.common.systemCli;
util.db.initDB();
util.db.sysWatch();
//util.common.mq.start();
util.log.init(1, logCfg);
const env = (process.env.NODE_ENV && systemconfig[process.env.NODE_ENV]) ? process.env.NODE_ENV : "development";
const config = systemconfig[env];
const routes = require('./routes/route');
//const snmproutes = require('./routes/snmpRoute');
const cwmroutes = require('./routes/cwmRoute');
const cwmAppRoutes = require('./routes/cwmAppRoutes');
const cwmExternalAPI = require('./routes/cwmExternalAPI');
//const cwmAvt = require('./routes/activationRoute');
const cwmNuclias = require('./routes/nucliasRoutes');
const cwmNSAPI = require('./routes/cwmNSAPI');

const tokenmanager = require("./lib/tokenManager");
const backup = require("./cwmcontroller/dbBackupRestore");
const dataMonitor = require("./cwmcontroller/dataMonitor");
const ssoManager = require("./cwmcontroller/nucliasManager");
//const avtManager=require("./cwmcontroller/avtManager");
const app = express();
const info = require("./lib/info");
/*var jwtCheck = expressJwt({
 secret: config.jwt_secret
 });*/
/*app.use('/api',jwtCheck);
 jwtCheck.unless = unless;
 app.use('/api', jwtCheck.unless({path: [
 '/api/auth/login',
 '/api/auth/logout'
 ]}));*/
// view engine setup

/*app.set('views', path.join(__dirname, '../website1'));
 app.engine('.html', ejs.__express);
 app.set('view engine', 'html');*/
// uncomment after placing your favicon in /public
info.getVersion();
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.all('*', function (req, res, next) {
    /* res.set('Access-Control-Allow-Origin', config.client);*/
    res.set('X-XSS-Protection','1;mode=block');
    /* res.set('X-Content-Type-Options','nosniff');*/
    res.set('Strict-Transport-Security', 'max-age=31536000');
    res.set('Access-Control-Allow-Credentials', true);
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.charset = 'utf-8';
    next();
});

/*加上这一句，前端页面可通过express一同发布
 如果分开发布可以去掉这一句
 * */
//app.use(express.static( '../website')); 这种表示方式，在linux系统下有问题
app.use(express.static(path.join(__dirname, './public/website1')));

let decryptTokenFromConfigFile = function () {
    let encrypted = config.jwt_secret;
    let key = "AEFTUOJUKM087";
    const decipher = crypto.createDecipher('aes192', key);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
let sessionsecret = decryptTokenFromConfigFile();
app.use(session({
    secret: sessionsecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        //maxAge: 1000 * 60 * 60,
        secure: true
    }
}));
/*这段可有可无*/
/*app.use(function (req, res, next) {
 if (req.path.indexOf('/api') >= 0) {
 next();
 } else {
 res.sendfile(__dirname+'/../website/index.html');
 }
 });*/
/* JWT 认证/授权 */
app.use("/api", function (req, res, next) {
    if (req.path.indexOf('/web/auth') >= 0) {
        console.log(req.path);
        next();
    } else if (req.path.indexOf('/web/dnc/app') >= 0 || req.path.indexOf('/web/cwm/app') >= 0) {
        console.log(req.path);
        next();
    } else if (req.path.indexOf('/authentication') >= 0) {
        next();
    } else if (req.path.indexOf('/web/avt') >= 0) {
        next();
    } else if (req.path.indexOf('/web/nuclias') >= 0) {
        next();
    } else if (req.path.indexOf('web/dnh/systemFwUpgrade') >= 0) {
        next();
    }
    else {
        dataMonitor.checkCSStatus((err, ok) => {
            if (!err && ok) {
                if (systemCli.getFwUpgradeStatus()) {
                    return res.sendStatus(555);
                } else {
                    tokenmanager.verifyToken(req, res, next);
                }
            } else {
                return res.sendStatus(510);
            }
        })

    }
});
app.use("/external/api/v1", cwmExternalAPI);
app.use("/nuclias", cwmNSAPI);
/*API路由*/
//暂时注掉
/*if(config.starterEdition) {
 app.use("/api/v1", coreroute);
 }*/
app.use("/api/web/dnc/app", cwmAppRoutes);
app.use("/api/web/cwm/app", cwmAppRoutes);
app.use("/api/web/auth", routes);
//app.use("/api/web/avt", cwmAvt);
app.use("/api/web/nuclias", cwmNuclias);
app.use("/api/web/dnh", cwmroutes);
let whitelist = ['user', 'logo', 'LoginFiles', 'hotApMaps'];

function checkpath(_path) {
    for (let wl of whitelist) {
        console.log("wl:" + wl);
        if (_path.indexOf(wl) != -1) {
            return true;
        }
    }
    return false;
}

app.use("/customer", function (req, res, next) {
    let reqpath = req.path;
    if (checkpath(reqpath)) {
        console.log("check ok");
        console.log(reqpath);
        reqpath = filePathFilter(reqpath);
        let _path = path.join(process.cwd(), `/customer/${reqpath}`);
        if (fs.existsSync(_path)) {
            res.sendFile(_path);
        }else{
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        }
    } else {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }

});
/*app.use("/public", function (req, res, next) {
 let reqpath=  ESAPI.encoder().encodeForURL(req.path);
 console.log(reqpath);
 let _path = path.resolve(__dirname, `/public/${reqpath}`);
 //  if (fs.existsSync(_path))
 {
 res.sendFile(_path);
 }
 });*/
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (err.name === 'UnauthorizedError') {
            res.status(401).send('invalid token...');
        } else {
            res.send({
                'error': {
                    message: err.message,
                    error: err
                }
            });
        }

    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500).send({
        'error': {
            message: err.message,
            error: {}
        }
    });
});

require("./lib/extend");

setInterval(function () {
    let now = new Date();
    let minute = now.getMinutes();
    let hour = now.getHours();
    if (minute == 2 && hour == 1) {
        dataMonitor.checkModulesOnline();
    }
    tokenmanager.refreshUserStatus();
}, 60 * 1000);

let needcheckClient = true;
if (needcheckClient) {
    setInterval(function () {
        dataMonitor.checkClientStatus();

    }, 180 * 1000);
}


// DNH-100 no activation
// avtManager.checkStrav(function(result) {
//     if (result == 'formal') {
//         clearInterval(checkAvt);
//     }
// });
// var checkAvt = setInterval(function () {
//     avtManager.checkStrav(function(result) {
//         if (result == 'formal') {
//             clearInterval(checkAvt);
//         }
//     });
// }, 6 * 60 * 60 * 1000);    // 6小時檢查一次

setInterval(function () {
    backup.autoLogBackup();
}, 60 * 1000 * 60);
ssoManager.checkSSOStatus();
module.exports = app;
