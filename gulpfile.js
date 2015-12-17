// Require Libraries
var gulp = require('gulp'),
    path = require('path'),
    prompt = require('gulp-prompt'),
    replace = require('gulp-replace'),
    compass = require('gulp-compass'),
    git = require('gulp-git'),
    del = require('del'),
    livereload = require('gulp-livereload'),
    fs = require('fs'),
    rename = require('gulp-rename');

// Current Working Directory
var cwd = process.env.INIT_CWD;

//Project Working Directory
var pwd = __dirname;

// System Specific Variables
// Builds a config file if none exist
// TODO: As more variables are needed, build in prompts for the setup. wptemplate may be going away, 
// as template location may not be important now that WP is grabbed through git.
try {
    var config = require('./config.json');
} catch (ex) {

    var entries = {
        localhost: cwd,
        wptemplate: ""
    };

    var config = JSON.stringify(entries, null, '\t');

    fs.writeFile('config.json', config, function (err) {
      if (err) throw err;
      console.log('config.json built');
    });
}

// Asset Directory
var assets_dir = cwd;

// Paths
var paths = {
    sass: assets_dir + '/scss/',
    css: assets_dir + '/css/',
    js: assets_dir + '/js/',
    img: assets_dir + '/img/',
    templates: assets_dir + '/templates/'
};

// Asset Locations
var assets = {
    templates: [paths.templates + '**/*.php'],
    sass: [paths.sass + '**/*.scss'],
    css: [paths.css + '**/*.css'],
    js: [paths.js + '**/*.js'],
    img: [paths.img + '**/**']
};

// Compass Task
gulp.task('compass', function () {
    gulp.src(paths.sass)
        .pipe(compass({
            config_file: assets_dir + '/scss/config.rb',
            css: paths.css,
            sass: paths.sass
        }))
        .pipe(gulp.dest(paths.sass));
});

// Watch Task
gulp.task('watch', function () {

    livereload.listen();
    gulp.watch(assets.sass, ['compass']);
    gulp.watch(assets.css, ['css-reload']);
    gulp.watch(assets.templates, ['css-reload']);
    gulp.watch(assets.js, ['css-reload']);

});

// Css Reload
gulp.task('css-reload', function () {
    gulp.src(assets.css)
        .pipe(livereload());
});

// Default
gulp.task('default', ['compass', 'watch']);

/***
 * Install Wordpress into a folder, ignoring wp-content files
 */
gulp.task('buildlocal', function () {

    gulp.src('gulpfile.js')
        .pipe(prompt.prompt({
            type: 'input',
            name: 'installname',
            message: 'Install Name?'
        }, function (res) {

            if (res.installname) {

                if (config.wptemplate.length <= 0) {
                    // If local wp-template directory missing from config, pull down from git via shallow clone.
                    // TODO: This fails if directory already exists. Might want to have this cache whatever is most recent
                    // into a local temp directory, and simply check if an update is needed each time.
                    git.clone('https://github.com/WordPress/WordPress.git', {args: '--depth 1 ./' + res.installname}, function (err) {
                        if (err) throw err;
                    });
                } else {
                    //Move files from a local template install into your current folder
                    gulp.src([
                        config.wptemplate + '/**/*',
                        '!' + config.wptemplate + '/wp-content/**/*',
                        '!' + config.wptemplate + '/wp-config.php'
                    ]).pipe(gulp.dest(cwd));
                }

                //Replace wp-config with a file for your localhost database
                gulp.src([config.wptemplate + '/wp-config.php'])
                    .pipe(replace("define('DB_NAME', 'wp-template');", "define('DB_NAME', '" + res.installname + "');"))
                    .pipe(gulp.dest(cwd));

            } else {
                //Error message if input is left blank
                console.log('ERROR: Please enter an install name');
            }

        }));
});


//Live Reload Snippet
// <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>
