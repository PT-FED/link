/**
 * Created by ligang on 16/10/19.
 * 待解决问题:
 * 1. action需要在模板插入成功后再触发,需要机制!!
 * 2. 缓存树
 * 3. 遍历文件获取所有地址信息
 * 4. 监听hashchange变化
 *  4.1 直接调转:redirect
 *  4.2 路由变化前和成功处理
 * 5. 异步资源加载问题,防抖
 * 6. 文档API及示例
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
        LINK_ATTR_HREF = "href",
        LINK_ATTR_TEMPLATE = "tpl",
        LINK_ATTR_CONTAINER = "container",
        LINK_ATTR_STATUS = "status",  // "visible","hidden","toggle"
        LINK_ATTR_ANIMATE = "animate",    // 动画
        LINK_ATTR_ACTION = "action",
        LINK_ATTR_GROUP = "group",

        /**
         * 发布事件
         */
        EVENTS = {
            ANIMATE: "link.animate" // 动画事件
        },

        EMPTY_FN = function (){};
