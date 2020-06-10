const glob = require('./globparams');

// Для SCSS / CSS
const sass = require('gulp-sass'), // scss -> css
    dependents = require('gulp-dependents'), // для отслеживания связных scss-файлов
    autoprefixer = require('gulp-autoprefixer'), // добавление css-префиксов
    cleanCSS = require('gulp-clean-css'); // минификация css-файлов


// CSS ==============================================================

function buildStyles() {
    let params = process.argv.splice(4);
    let sourcePath = glob.routes.src.styles;
    let defFilter = glob.routes.cssFilter;
    let buildPath = glob.routes.build.styles;
    let message = `Params not set. Use default build params`;
    let relpath = '';

    if (params.length) {
        sourcePath = glob.routes.src.code;
        defFilter = glob.routes.src.code;
        buildPath = glob.routes.build.code;
        relpath = { includeParents: -1 };
        message = `Applying build params`;
    }

    console.log(`[Build params] ${message} (source path:${sourcePath}, dest path:${buildPath}, filter:${defFilter})`);
    console.log('relative', glob.path.relative(glob.path.resolve('./'), ''))

    const filtered = glob.filter(defFilter);
    return glob.gulp.src(sourcePath, { allowEmpty: true })
        .pipe(glob.cache('files_changes'))
        .pipe(dependents()) // если есть связанные файлы, то меняем и их
        .pipe(glob.logger({// логируем изменяемые файлы
            showChange: true,
            before: `[${glob.modeMessage}] Starting build css-files...`,
            after: `[${glob.modeMessage}] Building css-files complete.`,
            colors: true
        }))
        .pipe(filtered)
        .pipe(glob.gulpIf(glob.isDevelopment, glob.sourcemaps.init()))
        .pipe(sass()) // переводим в css
        .pipe(autoprefixer({// добавляем префиксы
            remove: false,
            cascade: false,
        }))
        .pipe(glob.flatten(relpath)) // пишем файлы без сохранения структуры папок
        .pipe(glob.gulpIf(glob.isDevelopment, glob.sourcemaps.write('./'))) // пишем sourcemap-ы для .css файлов
        .pipe(glob.gulp.dest(buildPath))
        // .. далее минифицируем и добавляем sourcemap-ы для .min.css
        .pipe(glob.gulpIf(glob.isDevelopment, glob.filter('**/*.css')))
        .pipe(cleanCSS({// минификация css
            compatibility: 'ie8', // default
        }))
        .pipe(glob.rename((src_dir) => {
            src_dir.basename += '.min'; // до расширения файла
        }))
        .pipe(glob.gulpIf(glob.isDevelopment, glob.sourcemaps.write('./'))) // пишем sourcemap-ы для .css файлов
        .pipe(glob.gulp.dest(buildPath)) // выходная папка
        .pipe(glob.touch())
        .pipe(glob.size())
}

function watchCSS() {
    let watcher = glob.gulp.watch(glob.routes.src.styles, buildStyles);
    clearDeletedCSS(watcher);
}

function clearCSS() {
    return glob.gulp
        .src(glob.routes.build.styles, {
            read: false,
            allowEmpty: true
        })
        .pipe(
            glob.logger({
                showChange: true,
                before: 'Clearing destination folder...',
                after: 'Destination folder cleared!'
            })
        )
        .pipe(
            glob.clean({
                force: true
            })
        );
}

function clearDeletedCSS(watcher) {
    watcher.on('unlink', function (filepath) {
        let filePathFromSrc = glob.path.relative(glob.path.resolve('src'), filepath);
        let file = `${filePathFromSrc}`.split('scss/')[1]; // файл
        // let file = `${filePathFromSrc}`.split('/scss/')[1]; // файл
        let [file_name, file_ext] = file.split('.');
        file_ext = 'css';

        let delfile = glob.path.resolve(glob.routes.build.styles, `${file_name}.${file_ext}`);
        let delfilemap = glob.path.resolve(
            glob.routes.build.styles,
            `${file_name}.${file_ext}.map`
        );
        let delfilemin = glob.path.resolve(
            glob.routes.build.styles,
            `${file_name}.min.${file_ext}`
        );
        let delfileminmap = glob.path.resolve(
            glob.routes.build.styles,
            `${file_name}.min.${file_ext}.map`
        );

        glob.del.sync(delfile, {
            force: true
        });
        console.log('[File deleted] ', delfile);

        glob.del.sync(delfilemap, {
            force: true
        });
        console.log('[File deleted] ', delfilemap);

        glob.del.sync(delfilemin, {
            force: true
        });
        console.log('[File deleted] ', delfilemin);

        glob.del.sync(delfileminmap, {
            force: true
        });
        console.log('[File deleted] ', delfileminmap);
    });
}

// CSS
//	- main
exports.buildStyles = buildStyles;
exports.watchCSS = watchCSS;
exports.clearCSS = clearCSS;
exports.clearDeletedCSS = clearDeletedCSS;

glob.gulp.task('css', glob.gulp.series(buildStyles, glob.saveCache));
glob.gulp.task('watch-css', glob.gulp.series(buildStyles, glob.saveCache, watchCSS));
glob.gulp.task(
    'build-css',
    glob.gulp.series(buildStyles, glob.gulp.parallel(glob.clearSourceMaps, glob.clearCache))
);
glob.gulp.task('clear-css', clearCSS);