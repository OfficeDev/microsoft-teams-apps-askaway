const { pathsToModuleNameMapper } = require('ts-jest/utils');
const tsconfig = require('./tsconfig.json');
const path = require('path');

module.exports = {
    "preset": "ts-jest",
    "globalSetup": "./node_modules/@shelf/jest-mongodb/setup.js",
    "globalTeardown": "./node_modules/@shelf/jest-mongodb/teardown.js",
    "testEnvironment": "node",
    "testMatch": ["**/src/tests/**/*[.]test.[t]s?(x)"],
    "moduleNameMapper": pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: `${path.resolve(__dirname, '.')}/`})
};