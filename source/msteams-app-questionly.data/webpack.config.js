
var path = require('path');

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
    externals: [
        { mongoose: 'commonjs mongoose' },
    ],
    optimization: {
        minimize: false
    },
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