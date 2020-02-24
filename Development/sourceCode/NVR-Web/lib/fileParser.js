/**
 * Created by zhiyuan on 2015/11/26.
 */
'use strict';

var lineReader = require('line-reader');

var global = {
    EQUAL: "::=",
    NOTE: "--",
    EMPTY: "\r"
}

var module = {
    DEFINITIONS: "DEFINITIONS",//模块名称定义标记
    BEGIN: "BEGIN",//模块开始标记
    EXPORTS: "EXPORTS",//本模块中可能被其他模块引入的定义（未解析）
    IMPORTS: "IMPORTS",//由其他模块引入的定义（未解析）
    END: "END"//模块结束标记
}

var state = {
    READY: "READY",
    END: "END",
    NONE: "NONE"

}

var OBJECT_IDENTIFIER = "OBJECT IDENTIFIER";
var OBJECT_TYPE = "OBJECT-TYPE";
var MODULE_IDENTITY = "MODULE-IDENTITY";
var NOTIFICATION_TYPE = "NOTIFICATION-TYPE";


var Attribute = {
    SYNTAX: "SYNTAX",
    MAX_ACCESS: "MAX_ACCESS",
    ACCESS: "ACCESS",
    STATUS: "STATUS",
    DESCRIPTION: "DESCRIPTION",
    DEFVAL: "DEFVAL",
    INDEX: "INDEX",
    LAST_UPDATED: "LAST-UPDATED",
    ORGANIZATION: "ORGANIZATION",
    CONTACT_INFO: "CONTACT-INFO",
    OBJECTS: "OBJECTS"
}

exports.runAnalyser = function (filePath, dbMethod, callback) {

    let moduleName = "";
    let currentState = state.NONE;
    let lineArray = [];

    lineReader.eachLine(filePath, function (line, last) {
        //略过注释
        let noteIndex = line.indexOf(global.NOTE);
        if (noteIndex != -1) {
            line = line.substring(0, noteIndex);
        }
        //略过空行
        line = line.Trim();
        if (line == "" || line == global.EMPTY)
            return;
      //  console.log(line);

        //正文开始与结束
        if (line.indexOf(module.DEFINITIONS) != -1) {
            moduleName = line.substring(0, line.indexOf(module.DEFINITIONS));
            currentState = state.READY;
            return;
        } else if (line.indexOf(module.END) != -1) {
            currentState = state.END;
            return;
        }
        if (currentState == state.NONE || currentState == state.END)
            return;


        if (line.indexOf(OBJECT_IDENTIFIER) != -1) {
            if (line.indexOf(global.EQUAL) != -1) {
                currentState = state.READY;
                let result = analyseOBJECT_IDENTIFIER(line);
                dbMethod(result);
            }
        }
        else if (line.indexOf(OBJECT_TYPE) != -1) {
            currentState = OBJECT_TYPE;
            lineArray = [];
        } else if (line.indexOf(MODULE_IDENTITY) != -1) {
            currentState = MODULE_IDENTITY;
            lineArray = [];
        } else if (line.indexOf(NOTIFICATION_TYPE) != -1) {
            currentState = NOTIFICATION_TYPE;
            lineArray = [];
        }


        if (currentState == OBJECT_TYPE) {
            lineArray.push(line);
            if (line.indexOf(global.EQUAL) != -1) {
                currentState = state.READY;
                let result = analyseOBJECT_TYPE(lineArray);
                dbMethod(result);
            }
        } else if (currentState == MODULE_IDENTITY) {
            lineArray.push(line);
            if (line.indexOf(global.EQUAL) != -1) {
                currentState = state.READY;
                let result = analyseMODULE_IDENTITY(lineArray);
                dbMethod(result);
            }
        } else if (currentState == NOTIFICATION_TYPE) {
            lineArray.push(line);
            if (line.indexOf(global.EQUAL) != -1) {
                currentState = state.READY;
                let result = analyseNOTIFICATION_TYPE(lineArray);
                dbMethod(result);
            }
        }

        if (last) {
            callback();
        }

    });

    /*::= { dgs-1210-28cx 1 }*/
    function analyseOid(str) {
        str = str.replace(global.EQUAL, '').Trim();
        if (!str.startWith('{') || !str.endWith('}'))return null;
        str = str.substring(1, str.length - 1).Trim();
        let arr = str.split(/\s+/);
        if (arr.length == 2)
            return {name: arr[0], index: arr[1]};
        else if (arr.length == 1)
            return {name: null, index: arr[0]};
        else return null;
    }

    function analyseOBJECT_IDENTIFIER(str) {
        let arr = str.split(OBJECT_IDENTIFIER);
        let oid = analyseOid(arr[1]);
        return {
            module: moduleName,
            type: OBJECT_IDENTIFIER,
            name: arr[0].Trim(),
            parentName: oid ? oid.name : "",
            position: oid ? oid.index : ""
        };
    }

    function analyseOBJECT_TYPE(arr) {
        let i = -1;
        let name = "", SYNTAX = "", MAX_ACCESS = "", ACCESS = "", STATUS = "", DESCRIPTION = "", DEFVAL = "", INDEX = "";
        let temp = arr[++i];


        while (temp.indexOf(global.EQUAL) == -1) {
            if (temp.indexOf(OBJECT_TYPE) != -1) {
                name = temp.replace(OBJECT_TYPE, '').Trim();
            } else if (temp.indexOf(Attribute.SYNTAX) != -1) {
                SYNTAX = temp.replace(Attribute.SYNTAX, '').Trim();
                while (SYNTAX.indexOf('{') != -1 && SYNTAX.indexOf('}') == -1) {
                    SYNTAX += arr[++i].Trim();
                }
                SYNTAX = SYNTAX.replace(/\s+/g, "");
            } else if (temp.indexOf(Attribute.MAX_ACCESS) != -1) {
                MAX_ACCESS = temp.replace(Attribute.MAX_ACCESS, '').Trim();
            } else if (temp.indexOf(Attribute.ACCESS) != -1) {
                ACCESS = temp.replace(Attribute.ACCESS, '').Trim();
            } else if (temp.indexOf(Attribute.STATUS) != -1) {
                STATUS = temp.replace(Attribute.STATUS, '').Trim();
            } else if (temp.indexOf(Attribute.DESCRIPTION) != -1) {
                DESCRIPTION = temp.replace(Attribute.DESCRIPTION, '').Trim();
                while (!DESCRIPTION.Trim().endWith('"')) {
                    DESCRIPTION += " " + arr[++i].Trim();
                }
            } else if (temp.indexOf(Attribute.DEFVAL) != -1) {
                DEFVAL = temp.replace(Attribute.DEFVAL, '').Trim();
            } else if (temp.indexOf(Attribute.INDEX) != -1) {
                INDEX = temp.replace(Attribute.INDEX, '').Trim();
                while (INDEX.indexOf("}") == -1) {
                    INDEX += arr[++i];
                }
            }
            temp = arr[++i];
        }
        let oid = analyseOid(temp);

        return {
            module: moduleName,
            type: OBJECT_TYPE,
            name: name,
            SYNTAX: SYNTAX,
            MAX_ACCESS: MAX_ACCESS,
            ACCESS: ACCESS,
            STATUS: STATUS,
            DESCRIPTION: DESCRIPTION,
            INDEX: INDEX,
            parentName: oid ? oid.name : "",
            position: oid ? oid.index : ""
        }

    }

    function analyseMODULE_IDENTITY(arr) {
        let i = -1;
        let name = "", LAST_UPDATED = "", ORGANIZATION = "", CONTACT_INFO = "", DESCRIPTION = "";
        let temp = arr[++i];

        while (temp.indexOf(global.EQUAL) == -1) {
            if (temp.indexOf(MODULE_IDENTITY) != -1) {
                name = temp.replace(MODULE_IDENTITY, '').Trim();
            } else if (temp.indexOf(Attribute.LAST_UPDATED) != -1) {
                LAST_UPDATED = temp.replace(Attribute.LAST_UPDATED, '').Trim();
            } else if (temp.indexOf(Attribute.ORGANIZATION) != -1) {
                ORGANIZATION = temp.replace(Attribute.ORGANIZATION, '').Trim();
            } else if (temp.indexOf(Attribute.CONTACT_INFO) != -1) {
                CONTACT_INFO = temp.replace(Attribute.CONTACT_INFO, '').Trim();
                while (!CONTACT_INFO.Trim().endWith('"')) {
                    CONTACT_INFO += " " + arr[++i].Trim();
                }
            } else if (temp.indexOf(Attribute.DESCRIPTION) != -1) {
                DESCRIPTION = temp.replace(Attribute.DESCRIPTION, '').Trim();
                while (!DESCRIPTION.Trim().endWith('"')) {
                    DESCRIPTION += " " + arr[++i].Trim();
                }
            }
            temp = arr[++i];
        }
        let oid = analyseOid(temp);

        return {
            module: moduleName,
            type: MODULE_IDENTITY,
            name: name,
            LAST_UPDATED: LAST_UPDATED,
            ORGANIZATION: ORGANIZATION,
            CONTACT_INFO: CONTACT_INFO,
            DESCRIPTION: DESCRIPTION,
            parentName: oid ? oid.name : "",
            position: oid ? oid.index : ""
        }

    }

    function analyseNOTIFICATION_TYPE(arr) {
        let i = -1;
        let name = "", OBJECTS = "", STATUS = "", DESCRIPTION = "";
        let temp = arr[++i];

        while (temp.indexOf(global.EQUAL) == -1) {
            if (temp.indexOf(NOTIFICATION_TYPE) != -1) {
                name = temp.replace(NOTIFICATION_TYPE, '').Trim();
            } else if (temp.indexOf(Attribute.OBJECTS) != -1) {
                OBJECTS = temp.replace(Attribute.OBJECTS, '').Trim();
                while (OBJECTS.indexOf('{') != -1 && OBJECTS.indexOf('}') == -1) {
                    OBJECTS += arr[++i].Trim();
                }
            } else if (temp.indexOf(Attribute.STATUS) != -1) {
                STATUS = temp.replace(Attribute.STATUS, '').Trim();
            } else if (temp.indexOf(Attribute.DESCRIPTION) != -1) {
                DESCRIPTION = temp.replace(Attribute.DESCRIPTION, '').Trim();
                while (!DESCRIPTION.Trim().endWith('"')) {
                    DESCRIPTION += " " + arr[++i].Trim();
                }
            }
            temp = arr[++i];
        }
        let oid = analyseOid(temp);

        return {
            module: moduleName,
            type: NOTIFICATION_TYPE,
            name: name,
            OBJECTS: OBJECTS,
            STATUS: STATUS,
            DESCRIPTION: DESCRIPTION,
            parentName: oid ? oid.name : "",
            position: oid ? oid.index : ""
        }

    }
}


String.prototype.Trim = function () {
    return this.replace(/(^\s*)|(\s*$)/g, "");
};

String.prototype.LTrim = function () {
    return this.replace(/^\s*/, "");
};

String.prototype.RTrim = function () {
    return this.replace(/\s*$/, "");
};

String.prototype.Remove = function (A, B) {
    let s = '';
    if (A > 0)s = this.substring(0, A);
    if (A + B < this.length)s += this.substring(A + B, this.length);
    return s;
};

String.prototype.startWith = function (str) {
    return this.substring(0, str.length) == str;
}

String.prototype.endWith = function (str) {
    return this.substring(this.length - str.length) == str;
}

String.prototype.format = function () {
    let args = isArray(arguments[0]) ? arguments[0] : arguments;
    let result = this
    for (let i = 0, len = args.length; i < len; i++) {
        result = result.replace("{" + i + "}", args[i])
    }
    return result;
}

String.prototype.replaceAll = function (regexp, replacement) {
    return this.replace(new RegExp(regexp, "g"), replacement);
}

String.prototype.realLength = function () {
    return this.replace(/[^\x00-\xff]/g, "**").length;
}

