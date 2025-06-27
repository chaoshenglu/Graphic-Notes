import CryptoJS from 'crypto-js'

// 百度翻译API
class BaiduTranslator {
    constructor(appid, key) {
        this.appid = appid || '20231111001876991';
        this.key = key || 'UB9vfVGZDpO9fLod_TOy';
        this.apiUrl = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
    }

    /**
     * 翻译文本
     * @param {string} query - 要翻译的文本，多个query可以用\n连接
     * @param {string} from - 源语言，默认为'en'
     * @param {string} to - 目标语言，默认为'zh'
     * @param {function} successCallback - 成功回调函数
     * @param {function} errorCallback - 错误回调函数
     */
    translate(query, from = 'en', to = 'zh', successCallback, errorCallback) {
        const salt = (new Date).getTime();
        const str1 = this.appid + query + salt + this.key;
        const sign = CryptoJS.MD5(str1).toString();

        const params = new URLSearchParams({
            q: query,
            appid: this.appid,
            salt: salt,
            from: from,
            to: to,
            sign: sign
        });

        // 使用JSONP方式调用百度翻译API
        const script = document.createElement('script');
        const callbackName = 'baiduTranslateCallback_' + Date.now();
        
        // 设置全局回调函数
        window[callbackName] = function(data) {
            // 清理
            document.head.removeChild(script);
            delete window[callbackName];
            
            if (successCallback && typeof successCallback === 'function') {
                successCallback(data);
            } else {
                console.log('翻译结果:', data);
            }
        };
        
        // 设置错误处理
        script.onerror = function() {
            document.head.removeChild(script);
            delete window[callbackName];
            
            const error = '网络请求失败';
            if (errorCallback && typeof errorCallback === 'function') {
                errorCallback(error);
            } else {
                console.error('翻译失败:', error);
            }
        };
        
        script.src = `${this.apiUrl}?${params.toString()}&callback=${callbackName}`;
        document.head.appendChild(script);
    }

    /**
     * 批量翻译
     * @param {Array} queries - 要翻译的文本数组
     * @param {string} from - 源语言
     * @param {string} to - 目标语言
     * @param {function} successCallback - 成功回调函数
     * @param {function} errorCallback - 错误回调函数
     */
    batchTranslate(queries, from = 'en', to = 'zh', successCallback, errorCallback) {
        const query = queries.join('\n');
        this.translate(query, from, to, successCallback, errorCallback);
    }
}

const translator = new BaiduTranslator();

// ES6 exports
export { BaiduTranslator, translator };

// Browser compatibility
if (typeof window !== 'undefined') {
    window.BaiduTranslator = BaiduTranslator;
    window.translator = translator;
}

// 使用示例：
// translator.translate('apple', 'en', 'zh', function(data) {
//     console.log('翻译结果:', data);
// });
//
// 或者创建自定义实例：
// const myTranslator = new BaiduTranslator('your_appid', 'your_key');
// myTranslator.translate('hello world', 'en', 'zh');