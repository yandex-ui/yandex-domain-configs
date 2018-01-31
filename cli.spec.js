'use strict';

const fs = require('fs');
const path = require('path');
const spawnSync = require('child_process').spawnSync;

describe('yandex-domain-configs', () => {
    const outputDir = 'temp';

    function run(input) {
        const spawnArgs = [
            '-i', input,
            '-o', outputDir,
            '-s', 'mocks/config.schema.yaml'
        ];
        return spawnSync('./cli.js', spawnArgs, {
            stdio: [ 'pipe', 'pipe', 'inherit' ],
            encoding: 'utf8'
        });
    }

    function load(filename) {
        return JSON.parse(fs.readFileSync(filename, 'utf8'));
    }

    afterEach(() => {
        if (fs.existsSync(outputDir)) {
            fs.readdirSync(outputDir).forEach((filename) => {
                fs.unlinkSync(path.resolve(outputDir, filename));
            });
            fs.rmdirSync(outputDir);
        }
    });

    it('handles existence of outputDir', () => {
        fs.mkdirSync(outputDir);
        const result = run('mocks/config.yaml');
        expect(result.status).to.equal(0);
    });

    it('correctly inherits configs', () => {
        const result = run('mocks/config.yaml');
        expect(result.status).to.equal(0);
        expect(load('./temp/abc.json').arr).to.deep.equal([ 4, 5 ]);
        expect(load('./temp/abc.json').foo.bar).to.equal(3);
        expect(load('./temp/abc.json').foo.baz).to.equal(2);
        expect(load('./temp/abc.json').foo.qux).to.equal(3);
        expect(load('./temp/def.json').foo.bar).to.equal(4);
        expect(load('./temp/def.json').foo.baz).to.equal(8);
        expect(load('./temp/def.json').foo.qux).to.equal(6);
        expect(load('./temp/ghi.json').foo.bar).to.equal(9);
        expect(load('./temp/ghi.json').foo.baz).to.equal(8);
        expect(load('./temp/ghi.json').foo.qux).to.equal(3);
    });

    it('ignores domains absent in domainList', () => {
        const result = run('mocks/config.domainList.yaml');
        expect(result.status).to.equal(0);
        expect(load('./temp/abc.json').foo.bar).to.equal(2);
        expect(fs.existsSync('./temp/def.json')).to.be.false;
    });

    it('returns error if config is invalid', () => {
        const result = run('mocks/config.invalid.yaml');
        expect(result.status).to.equal(1);
        expect(result.stdout).to.match(/missing required property: foo/);
    });
});
