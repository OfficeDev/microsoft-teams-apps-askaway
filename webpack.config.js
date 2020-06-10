// Copyright (c) Wictor Wilén. All rights reserved. 
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

var webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
var TSLintPlugin = require('tslint-webpack-plugin');

var path = require('path');
var fs = require('fs');
var argv = require('yargs').argv;

var debug = argv.debug !== undefined;
const lint = argv["linting"];

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

var config = [{
        entry: {
            server: [
                __dirname + '/src/app/server.ts'
            ],
        },
        mode: debug ? 'development' : 'production',
        output: {
            path: __dirname + '/dist',
            filename: '[name].js',
            devtoolModuleFilenameTemplate: debug ? '[absolute-resource-path]' : '[]'
        },
        externals: nodeModules,
        devtool: 'source-map',
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            alias: {}
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
            }]
        },
        plugins: []
    },
];

if (lint !== false) {
    config[0].plugins.push(new TSLintPlugin({
        files: ['./src/app/*.ts']
    }));
}


module.exports = config;