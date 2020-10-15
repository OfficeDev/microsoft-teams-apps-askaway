const { pathsToModuleNameMapper } = require('ts-jest/utils');
const tsconfig = require('./tsconfig.json');
const path = require('path');

process.env.debugMode = 'true';

module.exports = {
    "preset": "ts-jest",
    "globalSetup": "./node_modules/@shelf/jest-mongodb/setup.js",
    "globalTeardown": "./node_modules/@shelf/jest-mongodb/teardown.js",
    "testEnvironment": "node",
    "moduleNameMapper": pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: `${path.resolve(__dirname, '.')}/`})
};