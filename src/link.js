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
            SHOW: "block",
            HIDE: "none",
            TOGGLE: "toggle"
        },

        LINK_PREFIX = "data",
        LINK_ITEM = "link",
        LINK_ITEM_ADDRESS = "href",
        /**
         * link属性
         * 例如:
         *  "tpl" ==> "link-tpl" ==> "data-link-tpl"
         *  "tpl" ==> LINK_ITEM + "-" + "tpl" ==> LINK_PREFIX + "-" + LINK_ITEM + "-tpl"
         */
        LINK_ITEM_TEMPLATE = "tpl",
        LINK_ITEM_TEMPLATE_URL = "tpl-url",
        LINK_ITEM_TEMPLATE_SELECTOR = "tpl-selector",
        LINK_ITEM_TARGET = "container",
        LINK_ITEM_BEHAVE = "status",  // "show","hide","toggle",function(){}
        LINK_ITEM_ACTION = "action",
        LINK_ITEM_GROUP = "group",

        EMPTY_FN = function (){};

    var cache = {count : 0};    // LINK_ITEM_ADDRESS + LINK_ITEM_TARGET 为key

    var util = {
        isFunction: function(obj){
            return Object.prototype.toString.call(obj) === "[object Function]";
        },
        isEmpty: function(obj){
            return obj === null || obj === undefined;
        }
    };

    var view = {
        searchUp: function searchUp(node, type) {
            if (node === document.body || node === document) return undefined;   // 向上递归到body就停
            if (this.hasAttribute(node, type)) {
                return node;
            }
            return searchUp(node.parentNode, type);
        },
        getHtmlContent: function getHtmlContent(url, callback) {
            if (!url) return callback();
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (event) {
                if (xhr.readyState == 4) {
                    if ((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                        return callback(xhr.responseText);
                    } else {
                        console.error("Request was unsuccessful: " + xhr.status);
                        return callback();
                    }
                }
            };
            xhr.open("get", url, true);
            xhr.send(null);
        },
        behave: function(node, behave){
            if(util.isFunction(behave)) return behave();
            var displayBehave = BEHAVE[behave.toUpperCase()] || BEHAVE.SHOW;
            if(displayBehave === BEHAVE.TOGGLE){
                displayBehave = (node.style.display === BEHAVE.HIDE ? BEHAVE.SHOW : BEHAVE.HIDE); // 注意""
            }
            node.style.display = displayBehave;
        },
        /**
         * @REVISIT
         */
        group: function(node, groupNode, groupName){
            if(util.isEmpty(groupName)) return false;
            var groupAttr = this.hitAttr(groupNode, LINK_ITEM_GROUP);
            var elements = this.getElements("["+groupAttr+"='"+groupName+"']");
            for(var i = 0, len = elements.length; i < len; i++){
                var ele = elements[i],
                    target = this.getElements(this.attr(ele, LINK_ITEM_TARGET))[0];
                target.style.display = "none";
            }
            node.style.display = "block";
        },
        hitAttr: function(node, attr){
            if(this.hasAttribute(node, attr)){
                return attr;
            }else if(this.hasAttribute(node, LINK_ITEM + "-" + attr)){
                return LINK_ITEM + "-" + attr;
            }else if(this.hasAttribute(node, LINK_PREFIX + "-" + LINK_ITEM + "-" + attr)){
                return LINK_PREFIX + "-" + LINK_ITEM + "-" + attr;
            }
        },
        getElements: function (selector) {
            return document.querySelectorAll(selector);
        },
        hasAttribute: function (node, attr) {
            return node.hasAttribute(attr);
        },
        attr: function (node, attr) {
            var attribute = this.hitAttr(node, attr);
            return node.getAttribute(attribute);
        },
        html: function(node, html){
            if(html === undefined)
                return node.innerHTML;
            node.innerHTML = html;
        }
    };

    var handleEvent = {
        init: function (link) {
            this.link = link;
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
            var node = view.searchUp(event.target, LINK_ITEM);
            if (node) {
                var url = view.attr(node, LINK_ITEM_ADDRESS),
                    target = view.attr(node, LINK_ITEM_TARGET),
                    cacheKey = url + target;
                var linkItem = handleEvent.link.getData(cacheKey);
                if (!linkItem) {
                    linkItem = {
                        template: view.attr(node, LINK_ITEM_TEMPLATE),
                        templateUrl: view.attr(node, LINK_ITEM_TEMPLATE_URL),
                        templateSelector: view.attr(node, LINK_ITEM_TEMPLATE_SELECTOR),
                        targetNodes: view.getElements(target),
                        behave: view.attr(node, LINK_ITEM_BEHAVE) || "",
                        action: view.attr(node, LINK_ITEM_ACTION) || EMPTY_FN,
                        group: view.attr(node, LINK_ITEM_GROUP)
                    };
                    handleEvent.link.setData(cacheKey, linkItem);
                }

                view.getHtmlContent(linkItem.templateUrl, function (content) {
                    var targetNodes = linkItem.targetNodes,
                        targetNode = "",
                        htmlContent = content || linkItem.template || view.html(view.getElements(linkItem.templateSelector)[0]);

                    for (var i = 0, len = targetNodes.length; i < len; i++) {
                        targetNode = targetNodes[i];
                        view.html(targetNode, htmlContent);
                        view.behave(targetNode, linkItem.behave);
                        view.group(targetNode, node, linkItem.group);
                        linkItem.action(targetNode);    // action封装第一个参数为"目标元素"
                    }
                });
            }
        }
    };


    function Link() {}
    Link.prototype = {
        setData: function (key, value) {
            cache.count++;
            cache[key] = value;
        },
        getData: function(index){
            return cache[index];
        },
        destroy: function(){
            cache = {count : 0};
        }
    };
    Object.defineProperty(Link.prototype, "constructor", {
        enumerable: false,
        value: Link
    });


    function destroy(link) {
        link.destroy();
    }
    function init() {
        var link = new Link();
        link.version = VERSION;
        link.destroy = destroy;
        handleEvent.init(link);
        return link;
    }

    return init();
}));