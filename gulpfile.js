var replace = require('gulp-replace');
var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

function saveConfig(environment) {

  var config = require('./config/' + environment + '.json');

  // Use `constants.js` as the source.
  gulp.src(['constants.js'])

    // Replace all occurrences of @apiUrl@.
    .pipe(replace(/@apiUrl@/g, config.apiUrl))
    .pipe(replace(/@placeholderImage@/g, config.placeholderImage))
    .pipe(replace(/@placeholderImagePath@/g, config.placeholderImagePath))
    .pipe(replace(/@mapboxDefaultSecretToken@/g, config.mapboxDefaultSecretToken))
    .pipe(replace(/@mapboxAccessToken@/g, config.mapboxAccessToken))
    .pipe(replace(/@mapboxMapId@/g, config.mapboxMapId))
    .pipe(replace(/@qimgUrl@/, config.qimgUrl))
    .pipe(replace(/@qimgToken@/, config.qimgToken))

    // Save the result in www/js.
    .pipe(gulp.dest('www/js'));
}

gulp.task('cdev', function(){
  saveConfig('dev');
});

gulp.task('cprod', function(){
  saveConfig('prod');
});