'use strict';

import del from 'del';
import gulp from 'gulp';
import util from 'gulp-util';
import uglify from 'gulp-uglify';
import bytediff from 'gulp-bytediff';
import size from 'gulp-size';
import minifyCss from 'gulp-minify-css';
import rev from 'gulp-rev';
import usemin from 'gulp-usemin';
import inject from 'gulp-inject';
import runSequence from 'run-sequence';

import {LOG, COLORS} from '../utils';
import paths from '../paths';

//=============================================
//            UTILS FUNCTIONS
//=============================================

/**
 * Format a number as a percentage
 * @param  {Number} num       Number to format as a percent
 * @param  {Number} precision Precision of the decimal
 * @return {String}           Formatted percentage
 */
function formatPercent(num, precision){
  return (num * 100).toFixed(precision);
}

/**
 * Formatter for bytediff to display the size changes after processing
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
  const difference = (data.savings > 0) ? ' smaller.' : ' larger.';
  return COLORS.yellow(data.fileName + ' went from ' +
    (data.startSize / 1000).toFixed(2) + ' kB to ' +
    (data.endSize / 1000).toFixed(2) + ' kB and is ' +
    formatPercent(1 - data.percent, 2) + '%' + difference);
}

//=============================================
//                  TASKS
//=============================================

/**
 * The 'clean' task delete 'build' and '.tmp' directories.
 * But keeps build/dist/.git (if you git init this folder to push to production via git)
 */
gulp.task('clean', (cb) => {
  const files = [
    paths.build.dist.basePath+'*',
    '!'+paths.build.dist.basePath+'.git*',
    paths.tmp.basePath
  ];
  LOG('Cleaning: ' + COLORS.blue(files));

  return del(files, cb);
});

//@todo complete (uglify / env based / ngAnnotate ...) + jsdoc
gulp.task('compile', ['htmlhint', 'sass', 'bundle'], () => {
  return gulp.src(paths.app.html)
    .pipe(inject(gulp.src(paths.tmp.scripts + 'app.bootstrap.build.js', {read: false})), {
      starttag: '<!-- inject:js -->'
    })
    .pipe(usemin({
      css:[
        bytediff.start(),
        minifyCss({keepSpecialComments: 0}),
        bytediff.stop(bytediffFormatter),
        rev()
      ],
      js:[
        bytediff.start(),
        uglify(),
        bytediff.stop(bytediffFormatter),
        rev()
      ]
    }))
    .pipe(gulp.dest(paths.build.dist.basePath))
    .pipe(size({title: 'compile', showFiles: true}));
});

/**
 * The 'build' task gets app ready for deployment by processing files
 * and put them into directory ready for production.
 */
//@todo manage environment / root files like .ico .htaccess ... / fonts ?
gulp.task('build', (cb) => {
  runSequence(
    ['clean'],
    ['compile','images'],
    cb
  );
});