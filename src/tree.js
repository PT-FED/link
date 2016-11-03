var radix = 1000000;
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
        this.levelBox[level] = {maxId: level * radix, items: []};
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
Tree.prototype.start = function(){
    this.resolveParent();
    console.log(this.levelBox);
};