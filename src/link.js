/**
 * Created by ligang on 16/10/19.
 */
(function (global, name, factory) {
    "use strict";

    if (typeof exports === 'object' && typeof module !== 'undefined') {
        module.exports = factory();
    } else if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(factory);
    } else {
        global[name] = factory();
    }
}(window || this, "link", function () {
    "use strict";

    // 常量
    var VERSION = "1.0.0",

        STATUS = {
            VISIBLE: "visible",
            HIDDEN: "hidden",
            TOGGLE: "toggle"
        },

        LINK_PREFIX_DATA = "data",
        LINK_PREFIX_LINK = "link",
        /**
         * link属性
         * 例如:
         *  "tpl" ==> "link-tpl" ==> "data-link-tpl"
         *  "tpl" ==> LINK_PREFIX_LINK + "-" + "tpl" ==> LINK_PREFIX_DATA + "-" + LINK_PREFIX_LINK + "-tpl"
         */
        LINK_ATTR_TEMPLATE = "tpl",
        LINK_ATTR_CONTAINER = "container",
        LINK_ATTR_STATUS = "status",  // "visible","hidden","toggle"
        LINK_ATTR_ANIMATE = "animate",    // 动画
        LINK_ATTR_ACTION = "action",
        LINK_ATTR_GROUP = "group",

        EMPTY_FN = function (){};

    /**
     * @FIXME
     * location.pathname + LINK_ATTR_TEMPLATE_URL 只缓存tpl-url的内容  (文件树)
     * 缺点:不同页面加载同一资源,不能做到缓存
     */
    var cache = {
        count : 0,
        set: function(key, value){
            cache[location.pathname + key] = value;
        },
        get: function(key){
            return cache[location.pathname + key];
        }
    };

    var util = {
        extend: function(targetObj, sourceObj){
            for(var pop in sourceObj){
                if(sourceObj.hasOwnProperty(pop)){
                    targetObj[pop] = sourceObj[pop];
                }
            }
            return targetObj;
        },
        isEmpty: function(obj){
            return obj === null || obj === undefined;
        },
        isSelector: function(selector){
            return /^[#.][0-9a-zA-z_-]+/.test(selector);
        },
        isFilePath: function(path){
            return /\.[0-9a-zA-z]+$/.test(path);
        }
    };

    var view = {
        searchUp: function searchUp(node, type) {
            if (node === document.body || node === document) return undefined;   // 向上递归到body就停
            if (node.hasAttribute(type)) {
                return node;
            }
            return searchUp(node.parentNode, type);
        },
        getHtmlContent: function getHtmlContent(template, callback) {
            if(!template) return callback("");
            if(util.isSelector(template)){  // 选择器(.或者#开头)
                return callback(this.html(document.querySelector(template)));
            }else if (!util.isFilePath(template)){  // 纯文本(无文件后缀)
                return callback(template);
            }else{  // url
                var content = cache.get(template);
                if (content) return callback(content);
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function (event) {
                    if (xhr.readyState == 4) {
                        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                            content = xhr.responseText;
                            cache.set(template, content);
                            return callback(content);
                        } else {
                            console.error("Request was unsuccessful: " + xhr.status);
                            return callback();
                        }
                    }
                };
                xhr.open("get", template, true);
                xhr.send(null);
            }
        },
        resolveLink: function(node){
            return {
                template: view.attr(node, LINK_ATTR_TEMPLATE),
                container: view.attr(node, LINK_ATTR_CONTAINER),
                status: view.attr(node, LINK_ATTR_STATUS) || STATUS.VISIBLE,
                animate: view.attr(node, LINK_ATTR_ANIMATE), // "" 区别 null
                action: view.attr(node, LINK_ATTR_ACTION) || EMPTY_FN,
                group: view.attr(node, LINK_ATTR_GROUP)
            }
        },
        status: function(targetNode, status){
            if(!status || !STATUS[status.toUpperCase()]) return;
            var displayBehave = STATUS[status.toUpperCase()];
            if(displayBehave === STATUS.TOGGLE){
                displayBehave = (targetNode.style.visibility === STATUS.VISIBLE ? STATUS.HIDDEN : STATUS.VISIBLE); // 注意""
            }
            targetNode.style.visibility = displayBehave;
        },
        animate: function(targetNode, animate, content){
            Event.trigger("link.animate", {targetNode: targetNode, animate: animate, content: content});
        },
        /**
         * @REVISIT
         */
        group: function(targetNode, node, groupName){
            if(util.isEmpty(groupName)) return false;
            var attrName = this.hitAttr(node, LINK_ATTR_GROUP);
            var elements = document.querySelectorAll("["+attrName+"='"+groupName+"']");
            for(var i = 0, len = elements.length; i < len; i++){
                document.querySelector(this.attr(elements[i], LINK_ATTR_CONTAINER)).style.display = "none";
            }
            targetNode.style.display = "block";
        },
        hitAttr: function(targetNode, attr){
            var attributes = targetNode.attributes;
            for(var i = 0, len = attributes.length; i < len; i++){
                var nodeAttr = attributes[i].name;   // "link-url"
                var reg = new RegExp("("+LINK_PREFIX_DATA+"-)?("+LINK_PREFIX_LINK+"-)?(.*)");
                if(attr === nodeAttr.replace(reg, "$3")){
                    return nodeAttr;
                }
            }
        },
        attr: function (targetNode, attr) {
            var attribute = this.hitAttr(targetNode, attr);
            return targetNode.getAttribute(attribute);
        },
        html: function(targetNode, html){
            if(html === undefined)
                return targetNode.innerHTML;
            targetNode.innerHTML = html;
        }
    };

    var Event = (function(){
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

    var handleEvent = {
        init: function () {
            this.unbind();
            this.bind();
        },
        unbind: function () {
            document.removeEventListener("click", this.click, false);
        },
        bind: function () {
            document.addEventListener("click", this.click, false);
        },
        click: function (event) {
            var node = view.searchUp(event.target, LINK_PREFIX_LINK);
            if (node) {
                var linkDom = view.resolveLink(node);

                view.getHtmlContent(linkDom.template, function (content) {
                    var targetNodes = document.querySelectorAll(linkDom.container),
                        targetNode = "";

                    for (var i = 0, len = targetNodes.length; i < len; i++) {
                        targetNode = targetNodes[i];
                        if(linkDom.animate !== null){
                            view.animate(targetNode, linkDom.animate, content);
                        }else{
                            view.html(targetNode, content);
                        }
                        view.status(targetNode, linkDom.status);
                        view.group(targetNode, node, linkDom.group);
                        eval("(" + linkDom.action + ")")(targetNode);    // action封装第一个参数为"目标元素"
                    }
                });
            }
        }
    };


    function Link(config) {
        config = util.extend({cache: false}, config);
        this.init(config);
    }
    Link.prototype = {
        init: function(config){
            handleEvent.init();
        },
        destroy: function(){
            cache = {count : 0};
        }
    };
    Object.defineProperty(Link.prototype, "constructor", {
        enumerable: false,
        value: Link
    });


    function init() {
        var link = new Link();
        link.version = VERSION;
        link.destroy = destroy;
        // 事件相关
        link.listen = link.on = Event.listen;
        link.remove = link.off = Event.remove;
        link.trigger = link.emit = Event.trigger;
        return link;
    }
    function destroy(link) {
        link.destroy();
    }

    return init();
}));