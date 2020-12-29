const { pathsToModuleNameMapper } = require('ts-jest/utils');
const tsconfig = require('./tsconfig.json');
const path = require('path');

process.env.debugMode = 'true';
process.env.ApplicationInsightsInstrumentationKey = 'random';

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
            prefix: `${path.resolve(__dirname, '.')}/`,
        }),
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    },
    transform: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            './fileTransformer.js',
    },
    globals: {
        window: {},
    },
};
