// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest'
    },
    binary: {
      version: '4.4.1',
      skipMD5: true
    },
    autoStart: false
  }
};