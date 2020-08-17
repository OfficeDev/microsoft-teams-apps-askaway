// Copyright (c) Wictor Wilén. All rights reserved.
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

// Load general config
const config = require('./gulp.config');

const package = require('./package.json');

const webpack = require('webpack');
const exec = require('child_process').exec;

// NodeJS
const fs = require('fs'),
    path = require('path');

// Gulp Base
const { src, dest, series, task, watch } = require('gulp');

// gulp plugins
const zip = require('gulp-zip'),
    replace = require('gulp-token-replace'),
    PluginError = require('plugin-error'),
    del = require('del');

// Web Servers
const ngrok = require('ngrok');

// load references
const nodemon = require('nodemon'),
    argv = require('yargs').argv,
    log = require('fancy-log'),
    ZSchema = require('z-schema'),
    axios = require('axios');

const env = argv['env'];
if (env === undefined) {
    require('dotenv').config();
} else {
    log(`Using custom .env`);
    require('dotenv').config({ path: path.resolve(process.cwd(), env) });
}
process.env.Version = package.version;

// TASK: nuke
task('nuke', () => {
    return del(['temp', 'dist']);
});

task('nodemon', (callback) => {
    var started = false;
    var debug = argv.debug !== undefined;

    return nodemon({
        script: 'dist/server.js',
        watch: ['dist/server.js'],
        nodeArgs: debug ? ['--inspect'] : [],
    }).on('start', function () {
        if (!started) {
            callback();
            started = true;
            log('HostName: ' + process.env.HostName);
        }
    });
});

const _webpack = (idx, callback) => {
    const webpackConfig = require(path.join(__dirname + '/webpack.config'));

    webpack(webpackConfig[idx], (err, stats) => {
        if (err) throw new PluginError('webpack', err);

        var jsonStats = stats.toJson();

        if (jsonStats.errors.length > 0) {
            jsonStats.errors.map((e) => {
                log('[Webpack error] ' + e);
            });

            throw new PluginError('webpack', 'Webpack errors, see log');
        }
        if (jsonStats.warnings.length > 0) {
            jsonStats.warnings.map(function (e) {
                log('[Webpack warning] ' + e);
            });
        }
        callback();
    });
};

task('build', (callback) => {
    _webpack(0, callback);
});

/**
 * Register watches
 */
const watches = () => {
    // watches for changes in files
    watch(config.watches, series('build'));
};

task('watch', watches);

/**
 * Replace parameters in the manifest
 */
task('generate-manifest', () => {
    return src('src/manifest/manifest.json')
        .pipe(
            replace({
                tokens: {
                    ...process.env,
                },
            })
        )
        .pipe(dest(config.temp));
});

/**
 * Schema validation
 */
task('schema-validation', (callback) => {
    let filePath = path.join(__dirname, 'temp/manifest.json');

    if (fs.existsSync(filePath)) {
        let manifest = fs.readFileSync(filePath, {
                encoding: 'UTF-8',
            }),
            manifestJson;

        try {
            manifestJson = JSON.parse(manifest);
        } catch (error) {
            callback(new PluginError(error.message));
            return;
        }

        log('Using manifest schema ' + manifestJson.manifestVersion);

        let definition = config.SCHEMAS.find(
            (s) => s.version == manifestJson.manifestVersion
        );

        if (definition === undefined) {
            callback(
                new PluginError('validate-manifest', 'Unable to locate schema')
            );
            return;
        }

        if (manifestJson['$schema'] !== definition.schema) {
            log(
                'Note: the defined schema in your manifest does not correspond to the manifestVersion'
            );
        }

        let requiredUrl = definition.schema;
        let validator = new ZSchema();

        let schema = {
            $ref: requiredUrl,
        };

        axios
            .get(requiredUrl, {
                decompress: true,
                responseType: 'json',
            })
            .then((response) => {
                validator.setRemoteReference(requiredUrl, response.data);

                var valid = validator.validate(manifestJson, schema);
                var errors = validator.getLastErrors();
                if (!valid) {
                    callback(
                        new PluginError(
                            'validate-manifest',
                            errors
                                .map((e) => {
                                    return e.message;
                                })
                                .join('\n')
                        )
                    );
                } else {
                    callback();
                }
            })
            .catch((err) => {
                log.warn(
                    'WARNING: unable to download and validate schema: ' + err
                );
                callback();
            });
    } else {
        console.log("Manifest doesn't exist");
    }
});

task('validate-manifest', series('generate-manifest', 'schema-validation'));

/**
 * Task for starting ngrok and replacing the HostName with ngrok tunnel url.
 * The task also creates a manifest file with ngrok tunnel url.
 * See local .env file for configuration
 */
task('start-ngrok', (cb) => {
    log('[NGROK] starting ngrok...');
    let conf = {
        subdomain: process.env.NGROK_SUBDOMAIN,
        region: process.env.NGROK_REGION,
        addr: process.env.PORT,
        authtoken: process.env.NGROK_AUTH,
    };

    ngrok
        .connect(conf)
        .then(async (url) => {
            log('[NGROK] Url: ' + url);
            if (!conf.authtoken) {
                log(
                    '[NGROK] You have been assigned a random ngrok URL that will only be available for this session. You wil need to re-upload the Teams manifest next time you run this command.'
                );
            }
            let hostName = url.replace('http://', '');
            hostName = hostName.replace('https://', '');

            log('[NGROK] HostName: ' + hostName);
            process.env.HostName = hostName;

            // updates azure bot registraion endpoint //
            // check if script exists
            const fileExists = async (path) =>
                !!(await fs.promises.stat(path).catch((e) => false));
            const scriptExists = await fileExists('azure-update-endpoint.sh');

            if (!scriptExists) {
                // script doesn't exists
                log('[AZ-ENDPOINT] script does not exist');
                cb();
                return;
            }

            // run script
            exec(
                `sh ./azure-update-endpoint.sh "https://${hostName}/api/messages"`,
                (err, stdout, stderr) => {
                    log(`[AZ-ENDPOINT] ${stdout}`);
                    cb(err);
                }
            );
        })
        .catch((err) => {
            log.error(`[NGROK] Error: ${JSON.stringify(err)}`);
            cb(err.msg);
        });
});

/**
 * Creates the tab manifest
 */
task('zip', () => {
    return src(config.manifests)
        .pipe(src('./temp/manifest.json'))
        .pipe(zip(config.manifestFileName))
        .pipe(dest('package'));
});

task('serve', series('nuke', 'build', 'nodemon', 'watch'));

task('manifest', series('validate-manifest', 'zip'));

task('ngrok-serve', series('start-ngrok', 'manifest', 'serve'));
