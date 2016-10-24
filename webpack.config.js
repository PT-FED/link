/**
 * Created by ligang on 16/10/10.
 */
var webpack = require("webpack");
var path = require("path");

var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

module.exports = {
    entry: "./src/link.js",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "link.min.js"
    },
    // 压缩JS
    plugins: [
        new uglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};