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

        BEHAVE = {
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
        LINK_ATTR_STATUS = "status",  // "visible","hidden","toggle",function(){}
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
        isFunction: function(obj){
            return Object.prototype.toString.call(obj) === "[object Function]";
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
                behave: view.attr(node, LINK_ATTR_STATUS) || BEHAVE.VISIBLE,
                action: view.attr(node, LINK_ATTR_ACTION) || EMPTY_FN,
                group: view.attr(node, LINK_ATTR_GROUP)
            }
        },
        behave: function(targetNode, behave){
            if(util.isFunction(behave)) return behave();
            var displayBehave = BEHAVE[behave.toUpperCase()];
            if(displayBehave === BEHAVE.TOGGLE){
                displayBehave = (targetNode.style.visibility === BEHAVE.VISIBLE ? BEHAVE.HIDDEN : BEHAVE.VISIBLE); // 注意""
            }
            targetNode.style.visibility = displayBehave;
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
                        view.html(targetNode, content);
                        view.behave(targetNode, linkDom.behave);
                        view.group(targetNode, node, linkDom.group);
                        linkDom.action(targetNode);    // action封装第一个参数为"目标元素"
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


    function init(config) {
        var link = new Link(config);
        return link;
    }
    function destroy(link) {
        link.destroy();
    }

    return {
        version: VERSION,
        init: init,
        destroy: destroy
    };
}));