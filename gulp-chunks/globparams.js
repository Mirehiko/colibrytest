// Подключаем модули gulp-a
const gulp = require('gulp');
const shell = require('gulp-shell');
const gulpIf = require('gulp-if');

// Общее для всех типов файлов
const clean = require('gulp-clean'), // удаление файлов и папок
    cleanBuild = require('gulp-dest-clean'), // удаление файлов в папке назначения если их нет в исходниках
    cache = require('gulp-cached'), // кэширование файлов
    rename = require('gulp-rename'), // переименование файла
    sourcemaps = require('gulp-sourcemaps'),
    filter = require('gulp-filter'), // фильтрация потока файлов по заданному фильтру
    logger = require('gulp-logger'), // логирование действий
    touch = require('gulp-touch-cmd'), // используется для обновления времени изменения фалйа
    del = require('del'), // удаление файла
    path = require('path'), // получение пути файла
    flatten = require('gulp-flatten'), // для управления структурой папок
    size = require('gulp-size'),
    mode = require('gulp-mode')({
        modes: ['production', 'development'],
        default: 'production',
        verbose: false
    }); // установки ключа --production/--development для сборки


//------------------------------------------------------------------------------


// Переменные
const entry = ''; // точка входа
const source_dir = `${entry}`; // папка с исходниками
const src_static = `${source_dir}src/`; // исходники скриптов и стилей
const dest_static = `${entry}dist/`; // папка выхлопа скриптов и стилей

const routes = {
    build: {
        scripts: `${dest_static}js/`,
        styles: `${dest_static}css/`,
        images: `${dest_static}images/`
    },
    src: {
        styles: [`${src_static}**/*.scss`, `${src_static}**/*.sass`],
    },
    cssFilter: [
        `${src_static}**/*.scss`,
        `${src_static}**/*.sass`,
        `!${src_static}components/**`
    ],
};

const isProduction = mode.production();
const isDevelopment = !isProduction;
const modeMessage = isProduction ? 'production' : 'development';


//------------------------------------------------------------------------------


module.exports.gulp = gulp;
module.exports.shell = shell;
module.exports.gulpIf = gulpIf;

module.exports.clean = clean;
module.exports.cleanBuild = cleanBuild;
module.exports.cache = cache;
module.exports.rename = rename;
module.exports.sourcemaps = sourcemaps;
module.exports.filter = filter;
module.exports.logger = logger;
module.exports.touch = touch;
module.exports.del = del;
module.exports.path = path;
module.exports.flatten = flatten;
module.exports.size = size;

//------------------------------------------------------------------------------

module.exports.entry = entry;
module.exports.source_dir = source_dir;
module.exports.src_static = src_static;
module.exports.dest_static = dest_static;
module.exports.routes = routes;

module.exports.isProduction = isProduction;
module.exports.isDevelopment = isDevelopment;
module.exports.modeMessage = modeMessage;


//------------------------------------------------------------------------------


// очистка дирректории с css-файлами от sourcemap-ов
function clearSourceMaps() {
    return gulp
        .src([`${dest_static}**/*.map`], {
            read: false,
            allowEmpty: true
        })
        .pipe(
            logger({
                showChange: true,
                before: 'Starting delete sourcemaps...',
                after: 'Sourcemaps deleted.'
            })
        )
        .pipe(
            clean({
                force: true
            })
        );
}

function saveCache() {
    const css = `${routes.build.styles}**/*.css`;
    // const maps = `${routes.build.styles}**/*.map`;
    const files_for_cache = [css]
        .concat(routes.src.styles);
    // .concat(routes.src.scripts);

    return gulp.src(files_for_cache).pipe(cache('files_changes'));
}

function clearCache() {
    return new Promise(function (resolve, reject) {
        delete cache.caches.files_changes;
        console.log('Cache cleared');
        resolve();
    });
}

exports.clearSourceMaps = clearSourceMaps;
exports.saveCache = saveCache;
exports.clearCache = clearCache;

// Clear
gulp.task('clear', gulp.series(clearSourceMaps, clearCache));
