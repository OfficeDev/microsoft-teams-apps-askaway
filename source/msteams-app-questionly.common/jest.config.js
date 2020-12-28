const { pathsToModuleNameMapper } = require('ts-jest/utils');
const tsconfig = require('./tsconfig.json');
const path = require('path');

module.exports = {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/src/tests/**/*[.]test.[t]s?(x)"],
    "moduleNameMapper": pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: `${path.resolve(__dirname, '.')}/`})
};