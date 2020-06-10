const glob = require('./gulp-chunks/globparams');
const js = require('./gulp-chunks/jstasks');
const css = require('./gulp-chunks/csstasks');

//------------------------------------------------------------------------------


// Отслеживание измененных файлов
function watchChanges() {
  const css_watcher = glob.gulp.watch(glob.routes.src.styles, css.buildStyles);
  css.clearDeletedCSS(css_watcher);
}

// All
exports.watchChanges = watchChanges;


//------------------------------------------------------------------------------


glob.gulp.task('default', glob.gulp.series(
  glob.gulp.parallel(css.buildStyles, js.buildJS),
));

glob.gulp.task(
  'watch',
  glob.gulp.series(
    glob.gulp.parallel(css.buildStyles, js.watchJS),
    glob.saveCache,
    watchChanges
  )
);

glob.gulp.task('build', glob.gulp.series(
  glob.gulp.parallel(css.buildStyles, js.buildJS),
  glob.gulp.parallel(glob.clearSourceMaps, glob.clearCache)
));