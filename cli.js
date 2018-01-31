#!/usr/bin/env node
'use strict';

const fs = require('fs');
const tv4 = require('tv4');
const _ = require('lodash');
const path = require('path');
const yaml = require('js-yaml');
const assert = require('assert');
const out = require('miniwrite').log();
const style = require('ministyle').ansi();
const reporter = require('tv4-reporter').getReporter(out, style);

const TAB = '   ';
const DOMAIN_LIST_KEY = '$domainList';
const DOMAINS_KEY = '$domains';
const EXTENDS_KEY = '$extends';

const options = require('commander')
    .option('-i, --input <filename>', 'Input file')
    .option('-o, --output-dir <dirname>', 'Output directory')
    .option('-s, --schema <filename>', 'JSON Schema')
    .parse(process.argv);

const configs = getConfigs(options.input);
const reports = validateConfigs(configs, options.schema);
writeConfigs(configs, options.outputDir);
if (reports.length) {
    reporter.reportBulk(reports);
    process.exit(1);
}

/**
 * Generates domain configs.
 *
 * @param {String} filename - Path to config.
 * @returns {Object} - Domain configs.
 */
function getConfigs(filename) {
    const config = inheritConfig(loadConfig, filename, resolvePath);

    const domains = config[DOMAINS_KEY];
    assert(_.isObjectLike(domains), '"$domains" must be an object');
    // Delete utility field.
    delete config[DOMAINS_KEY];

    let domainList = config[DOMAIN_LIST_KEY];
    if (domainList) {
        assert(Array.isArray(domainList), '"$domainList" must be an array');
        delete config[DOMAIN_LIST_KEY];
    } else {
        domainList = Object.keys(domains);
    }

    return domainList.reduce((configs, domain) => {
        // Inherit domain configs one from another.
        const domainConfig = inheritConfig((domain) => domains[domain], domain);
        // Merge with default settings.
        configs[domain] = _.merge({}, config, domainConfig);
        return configs;
    }, []);
}

/**
 * Validates domain configs.
 *
 * @param {Object} configs - Domain configs.
 * @param {String} schemaPath - Path to JSON schema.
 * @returns {Array} - Validation reports.
 */
function validateConfigs(configs, schemaPath) {
    const schema = loadConfig(schemaPath);

    return Object.keys(configs).reduce((reports, domain) => {
        const config = configs[domain];
        const result = tv4.validateMultiple(config, schema, false, true);
        if (!result.valid) {
            reports.push(reporter.createTest(schema, config, domain, result));
        }
        return reports;
    }, []);
}

/**
 * Writes domain configs to disk.
 *
 * @param {Object} configs - Domain configs.
 * @param {String} outputDir - Output directory.
 */
function writeConfigs(configs, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    for (const domain in configs) {
        const json = JSON.stringify(configs[domain], null, TAB);
        const filename = path.resolve(outputDir, `${domain}.json`);
        fs.writeFileSync(filename, json, 'utf8');
    }
}

/**
 * Recursively inherit configs.
 *
 * @param {Function} getter - Config getter.
 * @param {String} key - Config key.
 * @param {Function} [resolver] - Key resolver.
 * @returns {Object} - Resulting config.
 */
function inheritConfig(getter, key, resolver) {
    let config = getter(key);

    assert(config, `Config '${key}' not found`);

    if (config[EXTENDS_KEY]) {
        const parentKeys = [].concat(config[EXTENDS_KEY]);
        const parents = parentKeys.map((parentKey) => {
            if (resolver) {
                parentKey = resolver(key, parentKey);
            }
            return inheritConfig(getter, parentKey, resolver);
        });
        // Merge settings from all the parents and config itself.
        config = _.merge.apply(_, [ {} ].concat(parents, config));
        // Delete utility field.
        delete config[EXTENDS_KEY];
    }

    return config;
}

/**
 * Loads config in YAML format.
 *
 * @param {String} filename - Config path.
 * @returns {Object} - Config data.
 */
function loadConfig(filename) {
    return yaml.load(fs.readFileSync(filename, 'utf8'));
}

/**
 * Resolves relative configs paths.
 *
 * @param {String} baseFilename - Base path.
 * @param {String} filename - Relative path.
 * @returns {String} - Absolute path.
 */
function resolvePath(baseFilename, filename) {
    return path.resolve(path.dirname(baseFilename), filename);
}
