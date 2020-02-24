/**
 * Created by lizhimin on 2017/1/4.
 */
if (!Promise.prototype.done) {
    /**
     * 扩展Promise方法，用于始终捕获错误
     * @param errorMsg 错误路径
     * @param callback  传递错误的回调函数
     * @returns {Promise.<T>}
     */
    Promise.prototype.done = function (errorMsg, callback) {
        return this.catch(error=> {
            console.error(`【WebServer-Error】:${errorMsg}`);
            console.error((Object.is(typeof  error, 'string') ? error : error.stack));
            console.error_log(`【WebServer-Error】:${errorMsg}`);
            console.error_log((Object.is(typeof  error, 'string') ? error : error.stack));
            if (callback && Object.is(typeof callback, 'function')) {
                callback(error);
            }
        }).catch(error=> {
            console.error(`【WebServer-Error】:caught final error in proxy,source:${errorMsg}`);
            console.error((Object.is(typeof  error, 'string') ? error : error.stack));
            console.error_log(`【WebServer-Error】:caught final error in proxy,source:${errorMsg}`);
            console.error_log((Object.is(typeof  error, 'string') ? error : error.stack));
        });
    }
}
/**
 * 扩展Promise方法，用于resolve或者inject发生时始终执行
 * @param callback
 * @returns {Promise.<T>}
 */
if (!Promise.prototype.finally) {
    Promise.prototype.finally = function (callback) {
        return this.then(result=> {
            callback();
            return result;
        }, error=> {
            callback();
            throw error;
        });
    }
}

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (searchStr, replaceStr, ignoreCase) {
        return this.replace(new RegExp(searchStr, (ignoreCase ? 'gi' : 'g')), replaceStr);
    }
}
    Object.defineProperty(Array.prototype, 'find', {
        value: function(predicate) {//遍历的处理函数
            // 1. Let O be ? ToObject(this value).
            if (this == null) {//数组为null
                throw new TypeError('"this" is null or not defined');
            }

            var o = Object(this);//数组

            // 2. Let len be ? ToLength(? Get(O, "length")).
            var len = o.length >>> 0;//数组长度

            // 3. If IsCallable(predicate) is false, throw a TypeError exception.
            if (typeof predicate !== 'function') {//第一个参数必须是函数
                throw new TypeError('predicate must be a function');
            }

            // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
            var thisArg = arguments[1];//第二个参数指定this

            // 5. Let k be 0.
            var k = 0;//遍历索引

            // 6. Repeat, while k < len
            while (k < len) {
                // a. Let Pk be ! ToString(k).
                // b. Let kValue be ? Get(O, Pk).
                // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                // d. If testResult is true, return kValue.
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) {//如果当前值经过处理函数后返回了true，就返回当前值
                    return kValue;
                }
                // e. Increase k by 1.
                k++;
            }

            // 7. Return undefined.
            return undefined;//未找到就返回undefined
        }
    });