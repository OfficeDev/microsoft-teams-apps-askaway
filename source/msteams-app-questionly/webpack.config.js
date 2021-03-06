// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

var webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
var TSLintPlugin = require('tslint-webpack-plugin');

var path = require('path');
var fs = require('fs');
const copyWebpackPlugin = require('copy-webpack-plugin');
var argv = require('yargs').argv;

var debug = argv.debug !== undefined;
const lint = argv['linting'];

var nodeModules = {};
fs.readdirSync('node_modules')
    .filter(function (x) {
        return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function (mod) {
        nodeModules[mod] = 'commonjs ' + mod;
    });

var config = [
    {
        entry: {
            server: [__dirname + '/src/server.ts'],
        },
        mode: debug ? 'development' : 'production',
        output: {
            path: __dirname + '/dist',
            filename: '[name].js',
            devtoolModuleFilenameTemplate: debug
                ? '[absolute-resource-path]'
                : '[]',
        },
        externals: nodeModules,
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js'],
            modules: [path.resolve(__dirname, '.'), 'node_modules'],
        },
        target: 'node',
        node: {
            __dirname: false,
            __filename: false,
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: [/lib/, /dist/],
                    loader: 'ts-loader',
                },
            ],
        },
        optimization: {
            minimize: false
        },
        plugins: [
            new copyWebpackPlugin({
                patterns: [
                    {
                        from: path.join(__dirname, 'src/public'),
                        to: path.join(__dirname, 'dist/public'),
                    },
                    {
                        from: path.join(__dirname, 'src/app/localization/locales'),
                        to: path.join(__dirname, 'dist/web/locales'),
                    },
                ],
            }),
        ],
    },
    {
        entry: {
            client: [__dirname + '/src/app/scripts/client.ts'],
        },
        mode: debug ? 'development' : 'production',
        output: {
            path: __dirname + '/dist/web/scripts',
            filename: '[name].js',
            libraryTarget: 'umd',
            library: 'askAway',
            publicPath: '/scripts/',
        },
        externals: {},
        devtool: 'source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.css', '.scss', '.sass'],
            alias: {},
        },
        target: 'web',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    exclude: [/lib/, /dist/],
                    loader: 'ts-loader',
                    options: {
                        configFile: 'tsconfig-client.json',
                    },
                },
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    loader: 'file-loader?name=public/fonts/[name].[ext]',
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loader: 'file-loader?name=public/web/assets/[name].[ext]',
                },
                {
                    test: /\.(scss|sass|css)$/,
                    use: ['style-loader', 'css-loader', 'sass-loader'],
                },
            ],
        },
        plugins: [
            new Dotenv({
                systemvars: true,
            }),
        ],
        performance: {
            maxEntrypointSize: 400000,
            maxAssetSize: 400000,
            assetFilter: function (assetFilename) {
                return assetFilename.endsWith('.js');
            },
        },
    },
];

if (lint !== false) {
    config[0].plugins.push(
        new TSLintPlugin({
            files: ['./src/app/*.ts'],
        })
    );
    config[1].plugins.push(
        new TSLintPlugin({
            files: ['./src/app/scripts/**/*.ts', './src/app/scripts/**/*.tsx'],
        })
    );
}

module.exports = config;
