    var event = (function(){
        // cache = {"link.animate": [{fn: fn1, data: data1}, {fn: fn2, data: data2}]}
        var _caches = {},
            _listen,
            _trigger,
            _remove;

        _listen = function(keys, fn, data){
            // 支持多个事件，共享一个处理函数
            // 多个事件使用“逗号、空格、分号”间隔
            var keyAry = keys.split(/[\,\s\;]/);
            var index = keyAry.length;
            while (index){
                index--;
                var key = keyAry[index];
                if(!_caches[key]){
                    _caches[key] = [];
                }
                _caches[key].push({fn: fn, data: data});
            }
        };
        _remove = function(key, fn){
            if(_caches[key]){
                if(fn){
                    for(var i = 0, len = _caches[key].length; i < len; i++){
                        if(_caches[key][i].fn === fn){
                            _caches[key].splice(i, 1);
                        }
                    }
                }else{
                    _caches[key] = [];
                }
            }
        };
        /**
         * 触发顺序：A.B.C ==> A.B ==> A
         */
        _trigger = function(key, args){
            var event,
                aimKey = key,
                keyAry = key.split(".");
            for(var i = 0, len = keyAry.length; i < len; i++) {
                event = _caches[aimKey];
                if (event) {
                    var j = 0, length = event.length;
                    while (j < length) {
                        event[j].fn(args);
                        j++;
                    }
                }
                keyAry.pop();
                aimKey = keyAry.join(".");
            }
        };

        return {
            listen: _listen,
            remove: _remove,
            trigger: _trigger
        };
    })();
