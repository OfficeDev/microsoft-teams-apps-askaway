
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

module.exports = {
    entry: {
        index: [
            __dirname + '/src/index.ts'
        ],
    },
    output: {
        path: __dirname + '/dist',
        filename: '[name].js',
        libraryTarget: 'this'
    },
    optimization: {
        minimize: false
    },
    externals: nodeModules,
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        modules: [path.resolve(__dirname, '.'), 'node_modules']
    },
    target: 'node',
    node: {
        __dirname: false,
        __filename: false,
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            exclude: [/lib/, /dist/],
            loader: "ts-loader"
        },]
    }
};