/**
 * Created by zhiyuan on 2018/5/15.
 */

var http = require("http");
var url = require("url");
var querystring = require("querystring");
var fs = require('fs');

http.createServer(function (request, response) {
    var urlParamStr = url.parse(request.url);
    console.log(urlParamStr);
    var pathname = urlParamStr.pathname;
    var query = querystring.parse(urlParamStr.query);

    console.log("------------reseive-------------");
    console.log(pathname);
    console.log(query);
    if (pathname == '/') {
        //checkAllowedClient
        //if ok
        var params = JSON.parse(new Base64().decode(query.key));
        console.log(params);
        redirect(params.wrUrl);
    }

    function redirect(path) {
        var loc = path;
        var msg = 'Redirecting to <a href="' + escapeHtml(loc) + '">' + escapeHtml(loc) + '</a>\n';

        // redirect
        response.statusCode = 301;
        response.setHeader('Content-Type', 'text/html; charset=UTF-8');
        response.setHeader('Content-Length', Buffer.byteLength(msg));
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('Location', loc);
        response.end(msg);
    }

    function escapeHtml(string) {
        var matchHtmlRegExp = /["'&<>]/;
        var str = '' + string;
        var match = matchHtmlRegExp.exec(str);

        if (!match) {
            return str;
        }

        var escape;
        var html = '';
        var index = 0;
        var lastIndex = 0;

        for (index = match.index; index < str.length; index++) {
            switch (str.charCodeAt(index)) {
                case 34: // "
                    escape = '&quot;';
                    break;
                case 38: // &
                    escape = '&amp;';
                    break;
                case 39: // '
                    escape = '&#39;';
                    break;
                case 60: // <
                    escape = '&lt;';
                    break;
                case 62: // >
                    escape = '&gt;';
                    break;
                default:
                    continue;
            }

            if (lastIndex !== index) {
                html += str.substring(lastIndex, index);
            }

            lastIndex = index + 1;
            html += escape;
        }

        return lastIndex !== index
            ? html + str.substring(lastIndex, index)
            : html;
    }

}).listen(8003);
console.log('DAP listening at port 8003/');

function Base64() {

    // private property
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    // public method for encoding
    this.encode = function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
        input = _utf8_encode(input);
        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    }

    // public method for decoding
    this.decode = function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            output = output + String.fromCharCode(chr1);
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = _utf8_decode(output);
        return output;
    }

    // private method for UTF-8 encoding
    _utf8_encode = function (string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }
        return utftext;
    }

    // private method for UTF-8 decoding
    _utf8_decode = function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}

// 终端打印如下信息
