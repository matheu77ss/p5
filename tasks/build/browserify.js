'use strict';

const path = require('path');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const json = require('rollup-plugin-json');
const { terser } = require('rollup-plugin-terser');

module.exports = function(grunt) {
  grunt.registerTask('rollup', 'Compile the p5.js source with Rollup', function(
    param
  ) {
    var isMin = param === 'min';
    var filename = isMin ? 'p5.min.js' : 'p5.js';

    const bannerTemplate = `// banner template goes here`;

    // This file will not exist until it has been built
    var libFilePath = path.join(__dirname, '../../lib/', filename);

    var srcFilePath = path.join(__dirname, '../../src/app.js');

    let plugins = [resolve(), commonjs(), json()];

    plugins = isMin ? [...plugins, terser()] : plugins;

    const inputOptions = {
      input: srcFilePath,
      plugins: plugins
    };
    const outputOptions = {
      format: 'umd',
      file: libFilePath,
      name: 'p5',
      banner: bannerTemplate
    };

    // Reading and writing files is asynchronous
    const done = this.async();

    rollup.rollup(inputOptions).then(bundle => {
      bundle.generate(outputOptions).then(() => {
        bundle.write(outputOptions).then(() => {
          // Print a success message
          grunt.log.writeln(
            '>>'.green + ' Bundle ' + ('lib/' + filename).cyan + ' created.'
          );
          // Complete the task
          done();
        });
      });
    });
  });
};
