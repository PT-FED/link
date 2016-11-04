'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
    return gulp.src(["src/intro.js", "src/util-event.js", "src/util-tree.js", "src/core.js", "src/outro.js"])
        .pipe(concat('link.js'))
        .pipe(gulp.dest("dist"))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest("dist"));
});