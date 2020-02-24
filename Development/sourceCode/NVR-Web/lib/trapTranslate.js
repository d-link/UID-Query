/**
 * Created by lizhimin on 12/8/16.
 */
'use strict';
const async = require('async');
const db = require("../lib/util").db;
const common = require("../lib/util").common;
function translateBindingVariable(variable, _data, trapEntrys, callback) {
    if (_data.bindingVariable && _data.bindingVariable.length > 0) {
        async.map(_data.bindingVariable, (binding, callback)=> {
            let tempvariable = ``;
            let matchTrapOID = '', matchTrapName = '';
            let matchValues = [];
            for (let trapEntry of trapEntrys) {
                if (_data.trapOID.startsWith(trapEntry.oid)) {
                    if (matchTrapOID.length < trapEntry.oid.length) {
                        matchTrapOID = trapEntry.oid;
                        matchTrapName = trapEntry.name;
                        matchValues = trapEntry.bindingVariables;
                    }
                }
            }
            if (matchTrapName != '') {
                let sub = _data.trapOID.replace(matchTrapOID, matchTrapName);
                tempvariable += `Binding Variable:${sub}`;
                if (matchValues && matchValues.length > 0) {
                    let hasVariable = false;
                    for (let item of matchValues) {
                        if (item.variable == binding.value) {
                            tempvariable += `=${item.value}`;
                            hasVariable = true;
                            break;
                        }
                    }
                    if (!hasVariable) tempvariable += `=${binding.value}`;
                }
            } else {
                tempvariable += `Binding Variable:${binding.variable}`;
                tempvariable += `=${binding.value}`;
            }
            callback(null, tempvariable);
        }, (err, result)=> {
            _data.message = [];
            if (variable && variable != "") {
                _data.message.push(variable);
            }
            if (_data.message.length > 0 && result.length > 0) variable += '\n';
            for (let str of result) {
                _data.message.push(str);
            }

            callback(null, _data);
        });

    } else {
        _data.message = variable;
        callback(null, _data);
    }
}
exports.translateTrapOID = function (trapEntrys, variableEntrys, _data, callback) {
    if (_data.hasOwnProperty('_doc')) {
        _data = _data.toObject();
    }
    if (_data.snmpVersion == 'v2' || (_data.snmpVersion == 'v1' && _data.genericType == 'enterpriseSpecific')) {
        _data.genericType = 'enterpriseSpecific';

    }
    let matchTrapOID = '', matchTrapName = '';
    for (let trapEntry of trapEntrys) {
        if (_data.trapOID && _data.trapOID.startsWith(trapEntry.oid)) {
            if (matchTrapOID.length < trapEntry.oid.length) {
                matchTrapOID = trapEntry.oid;
                matchTrapName = trapEntry.name;
            }
        }
    }
    let variable = ``;
    if (matchTrapName != '') {
        let sub = _data.trapOID.replace(matchTrapOID, matchTrapName);
        variable = `TrapOID: ${sub}`;
    } else {
        variable = `TrapOID: ${_data.trapOID}`;
    }

    translateBindingVariable(variable, _data, variableEntrys, callback);
}