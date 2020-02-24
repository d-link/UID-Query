module.exports = function(str){
    if(str && typeof str == "string"){
        return str.replace(/[.]+[\\\/]+/g,'');
    }else{
        return str;
    }
}