/**
 * Created by lizhimin on 2018/11/5.
 */
var path = require('path');
var fs = require('fs');
var iconv = require('iconv-lite');


function getLang(num,callback) {
    let resultStr="";
    fs.readFile(path.join(__dirname, 'CWM_LANG_201811052.txt'), {encoding:'binary'}, (err, fileStr) => {

        var buf = new Buffer(fileStr, 'binary');
        var fileData = iconv.decode(buf, 'gb2312');
        //  fileData=iconv.decode(fileData, 'gbk')
      // fileData = iconv.decode(fileData, 'gb2312');
        console.log(fileData);
        fileData = fileData.replace(/\r/g, '');
        let pp = fileData.split('\n');
        console.log("rows is " + pp.length);
        let count = 0;
        let ppjson={};

        for(let k=1;k<pp.length;k++){
            let ppp = pp[k].split('\t');
            for (let i = 0; i < ppp.length; i++) {
                let first= ppp[0];
                if(first&&first!=''){
                    let arr=first.split('.');
                    let obj={};
                    let len=arr.length;
                    if(arr.length>1){
                        if(!ppjson[arr[0]]) ppjson[arr[0]]={};
                        obj= ppjson[arr[0]];
                        if(arr.length==3){
                            if(!ppjson[arr[0]][arr[1]]) ppjson[arr[0]][arr[1]]={};
                            obj= ppjson[arr[0]][arr[1]];
                        }
                        if(arr.length==4){
                            if(!ppjson[arr[0]][arr[1]]) ppjson[arr[0]][arr[1]]={};
                            if(!ppjson[arr[0]][arr[1]][arr[2]]) ppjson[arr[0]][arr[1]][arr[2]]={};
                            obj= ppjson[arr[0]][arr[1]][arr[2]];
                        }
                    }
                    if(len==1){
                        obj= ppjson;
                    }
                    obj[arr[len-1]]=ppp[num];
                }
            }
        }

        let ppp = pp[0].split(',');
        // console.log(resultStr);
        callback(ppjson,ppp[num]);
    })
  }

/*getLang(2,function(str){
   // console.log(str);
});
getLang(3,function(str){
    // console.log(str);
});
getLang(4,function(str){
    // console.log(str);
});*/
/*getLang(9,function(str){
    // console.log(str);
});*/
/*for(let i=2;i<13;i++){
    getLang(i,function(ppjson,name){
        console.log(JSON.stringify(ppjson));
        if(name){
            fs.writeFile(path.join(__dirname,"logFiles/"+name+".js"), `define(${JSON.stringify(ppjson)})`,function (err, data) {
                if (err) {
                    console.log(err);
                }

            })
        }

    });
}*/
let oldlang=require("./lang.js").lang;
let newlang=require("./newlan.js").lang;

/*let langNames= Object.getOwnPropertyNames(langEn);
var arrStr="";
for (let prop of langNames) {

    let propName = prop;
    let ppstr="";
    let ppvalue="";
    if(typeof langEn[propName] == "object"){
        ppstr+=propName+".";
      getPropertyValue(langEn[propName],ppstr);
    }else{
        ppstr+=propName;
        ppvalue=langEn[propName];
        arrStr+=  ppstr+",";
        arrStr+=  ppvalue;
        arrStr+=  "\r\n";
    }

}
function getPropertyValue(lang,ppstr,isNew){
    let langNames= Object.getOwnPropertyNames(lang);
    for (let prop of langNames) {
        let ppvalue="";
        let propName = prop;
        let pppstr=ppstr;
        if(typeof lang[propName] == "object"){
            pppstr+=propName+".";
            getPropertyValue(lang[propName],pppstr,isNew);
        }else{
            pppstr+=propName;
            ppvalue=lang[propName];
            if(isNew){
                new_arrStr+=  pppstr+",";
                new_arrStr+=  ppvalue;
                new_arrStr+=  "\r\n";
            }else{
                arrStr+=  pppstr+",";
                arrStr+=  ppvalue;
                arrStr+=  "\r\n";
            }

        }
    }
}*/
function getPropertyValue(lang,ppstr,isNew){
    let langNames= Object.getOwnPropertyNames(lang);
    for (let prop of langNames) {
        let ppvalue="";
        let propName = prop;
        let pppstr=ppstr;
        if(typeof lang[propName] == "object"){
            pppstr+=propName+".";
            getPropertyValue(lang[propName],pppstr,isNew);
        }else{
            pppstr+=propName;
            ppvalue=lang[propName];
            if(isNew){
                new_arrStr+=  pppstr+",";

                new_arr[pppstr]=ppvalue;
                new_arrStr+=  ppvalue;
                new_arrStr+=  "\r\n";
            }else{
                arrStr+=  pppstr+",";
                arr[pppstr]=ppvalue;
                arrStr+=  ppvalue;
                arrStr+=  "\r\n";
            }

        }
    }
}
let langNames= Object.getOwnPropertyNames(oldlang);
let new_langNames= Object.getOwnPropertyNames(newlang);
var new_arr={};
var arr={};
var new_arrStr="";
var arrStr="";
for (let prop of new_langNames) {

    let propName = prop;
    let ppstr="";
    let ppvalue="";
    if(typeof newlang[propName] == "object"){
        ppstr+=propName+".";
        getPropertyValue(newlang[propName],ppstr,true);
    }else{
        ppstr+=propName;
        ppvalue=newlang[propName];
        new_arrStr+=  ppstr+",";
        new_arr[ppstr]=ppvalue;
        new_arrStr+=  ppvalue;
        new_arrStr+=  "\r\n";
    }

}
for (let prop of langNames) {

    let propName = prop;
    let ppstr="";
    let ppvalue="";
    if(typeof oldlang[propName] == "object"){
        ppstr+=propName+".";
        getPropertyValue(oldlang[propName],ppstr,false);
    }else{
        ppstr+=propName;
        ppvalue=oldlang[propName];
        arrStr+=  ppstr+",";
        arr[ppstr]=ppvalue;
        arrStr+=  ppvalue;
        arrStr+=  "\r\n";
    }

}

for(let pp in new_arr){
    if(!arr.hasOwnProperty(pp)){
       // console.log(pp);
        console.log(new_arr[pp]);
    }
}
/*fs.writeFile("lanCSV1.csv", arrStr, function (err, data) {
    if (err) {
       console.log(err);
    }

})*/
