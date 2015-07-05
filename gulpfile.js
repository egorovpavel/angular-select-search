var gulp = require('gulp')
    , uglify = require('gulp-uglify')
    , concat = require('gulp-concat')
    , templateCache = require('gulp-angular-templatecache');

process.chdir(__dirname);

gulp.task('templateCache', function() {
    return gulp.src('src/*/*.html')
        .pipe(templateCache('angular-select-search.tpl.js', {
            module: 'selectSearch'
        }))
        .pipe(gulp.dest('src/templates'));
});

gulp.task('buildMinified', ['templateCache'], function() {
    return gulp.src(['src/*.js', 'src/*/*.js', 'bower_components/angular-vs-repeat/src/angular-vs-repeat.js'])
        .pipe(uglify({
            mangle: false
        }))
        .pipe(concat('angular-select-search.min.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('build', ['buildMinified'], function() {
    return gulp.src(['src/*.js', 'src/*/*.js', 'bower_components/angular-vs-repeat/src/angular-vs-repeat.js'])
        .pipe(concat('angular-select-search.js'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build'])