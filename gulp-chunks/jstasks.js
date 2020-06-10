const glob = require('./globparams');

// JS / TS
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const tsify = require("tsify");
const buffer = require("vinyl-buffer");

const watchify = require("watchify");
const fancy_log = require("fancy-log");
const uglify = require("gulp-uglify");

const bundles = [
    { name: "app", src: `src/ts/app.ts`, dest: `app.js` },
    { name: "main", src: `src/ts/main.ts`, dest: `main.js` },
];

function buildJS() {
    return new Promise(function (resolve, reject) {
        bundles.forEach((item) => {
            makeBundle(item);
        })
        resolve();
    });
}

function makeBundle(bundle) {
    compileJS({
        bundler: browserify({
            basedir: glob.entry,
            debug: true,
            entries: [bundle.src],
            cache: {},
            packageCache: {}
        }), bundleFile: bundle
    });
}

function watchJS() {
    return new Promise(function (resolve, reject) {
        bundles.forEach((item) => {
            const w = watchBundle.bind(item);
            w(item);
        })
        resolve();
    });
}

function watchBundle(bundleFile) {
    const b = browserify({
        basedir: glob.entry,
        debug: true,
        entries: [bundleFile.src],
        cache: {},
        packageCache: {}
    });

    b.plugin(watchify);
    b.on('error', fancy_log);
    // b.on('error', function (err) {
    //     // gutil.log(err.toString());
    //     console.log(err.toString());
    //     this.emit('end');
    //     done();
    // });
    console.log('Builded:', bundleFile.name);
    const compiler = compileJS.bind(this, { bundler: b, bundleFile: bundleFile });
    compiler({ bundler: b, bundleFile: bundleFile });
    b.on('update', function (evt) {
        console.log('Updated:', bundleFile.name);
        console.log('watchify update ' + evt);
        compiler({ bundler: b, bundleFile: bundleFile });
    });
}

function compileJS(params) {
    return params.bundler
        .plugin(tsify)
        .transform("babelify", {
            presets: ["es2015"],
            extensions: [".ts"]
        })
        .bundle()
        .pipe(source(params.bundleFile.dest))
        .pipe(glob.logger({// логируем изменяемые файлы
            showChange: true,
            after: `[${glob.modeMessage}] ${params.bundleFile.name} is build successfully.`,
            colors: true
        }))
        .pipe(buffer())
        .pipe(glob.gulpIf(glob.isDevelopment, glob.sourcemaps.init({ loadMaps: true })))
        .pipe(glob.gulpIf(glob.isProduction, uglify()))
        .pipe(glob.gulpIf(glob.isDevelopment, glob.sourcemaps.write("./")))
        .pipe(glob.gulp.dest('dist/js'));
}

module.exports.bundles = bundles;
module.exports.makeBundle = makeBundle;

module.exports.buildJS = buildJS;
module.exports.watchJS = watchJS;

glob.gulp.task("build-js", glob.gulp.series(buildJS));
glob.gulp.task("watch-js", glob.gulp.series(watchJS));
