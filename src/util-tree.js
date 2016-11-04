    var RADIX = 1000000;
    function Node(id, path, pid, config){
        this.id = id;
        this.path = path;
        this.pid = pid;
        this.config = config;
    }
    Node.prototype.setId = function(id){
        this.id = id;
        return this;
    };
    Node.prototype.setPid = function(pid){
        this.pid = pid;
        return this;
    };

    /* 树 */
    function Tree(){
        this.nodeList = [];    // [node1, node2] 稀疏数组,下标为ID
        this.levelBox = [];    // 存储等级,及当前等级对应的最后一个值 下标为等级:[{maxId: 3000005, items;[node1, node2]}]
    }
    Tree.prototype.insert = function(path, config){
        path = path.replace(/\/*$/, "");
        var node = new Node(null, path, null, config);
        var id = this.generateId(node);
        this.nodeList[id] = node.setId(id);
        return this;
    };
    Tree.prototype.generateId = function(node){
        var level = node.path.split("/").length;
        if(!this.levelBox[level]){
            this.levelBox[level] = {maxId: level * RADIX, items: []};
        }
        var id = this.levelBox[level].maxId + 1;
        this.levelBox[level].maxId = id;
        return id;
    };
    Tree.prototype.resolveParent = function(){
        var nodeList = this.nodeList.concat();
        var handledNodeList = [];
        nodeList.forEach(function (node) {
            for(var i = handledNodeList.length - 1; i >= 0; i--){
                var handleNode = handledNodeList[i];
                if(node.path.indexOf(handleNode.path) === 0){
                    node.setPid(handleNode.id);
                    break;
                }
            }
            handledNodeList.push(node);
        });
    };
    Tree.prototype.collect = function(event){
        var node = view.searchUp(event.target, LINK_PREFIX_LINK);
        if (node) {
            var linkDom = view.resolveLink(node);
            this.insert(view.attr(node, LINK_ATTR_HREF), linkDom);
        }
    };
    Tree.prototype.print = function(){
        var nodeList = this.nodeList.concat();
        var result = {};
        nodeList.forEach(function(node){
           result[node.path] = node.config;
        });
        console.log(result);
    },
    Tree.prototype.start = function(){
        var that = this;
        // document.removeEventListener("click", this.collect.call(this), false);
        // @FIXME 移除事件 注意冲突
        document.addEventListener("click", function(event){
            that.collect(event);
        }, false);
    };
    Tree.prototype.end = function(){
        // document.removeEventListener("click", this.collect, false);
        this.resolveParent();
        this.print();
    };
