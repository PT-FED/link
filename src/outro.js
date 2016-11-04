    function init() {
        var link = new Link();
        link.version = VERSION;
        link.destroy = destroy;
        // 事件相关
        link.listen = link.on = event.listen;
        link.remove = link.off = event.remove;
        link.trigger = link.emit = event.trigger;
        // 目录树相关
        var fileTree = new Tree();
        link.startRecording = function() {
            fileTree.start();
        };
        link.endRecording = function(){
            fileTree.end();
        };
        return link;
    }
    function destroy(link) {
        link.destroy();
    }

    return init();
}));
