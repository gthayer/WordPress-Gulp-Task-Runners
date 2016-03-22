/** Require Libraries. */

var gulp = require( 'gulp' ),
	path = require( 'path' ),
	prompt = require( 'gulp-prompt' ),
	replace = require( 'gulp-replace' ),
	compass = require( 'gulp-compass' ),
	git = require( 'gulp-git' ),
	del = require( 'del' ),
	fs = require( 'fs' ),
	rename = require( 'gulp-rename' );
	browserSync = require('browser-sync');
	WP = require('wp-cli');

// Current Working Directory.
var cwd = process.env.INIT_CWD;

// Project Working Directory.
var pwd = __dirname;

// System Variables.
var config;
var response;

gulp.task('serve', function() {
    browserSync.init({
        
        // TODO: Set proxy address dynamically
        proxy: "http://dev/woocommerce/",
		ghostMode: {
			clicks: true,
			forms: true,
			scroll: true
		}
    });

    gulp.watch( cwd + '**/*.php', ['live-reload']);

});

gulp.task( 'build-config', function( callback ) {
	// Builds a config file if none exist.
	try {
		config = require( './config.json' );
		callback();
	} catch (ex) {

		console.log( "Let's get some info about your environment:" );

		gulp.src( 'gulpfile.js' )
			.pipe( prompt.prompt([{
				type: 'input',
				name: 'db_user',
				message: 'Database Username?',
				validate: function( db_user ) {
					if ( db_user.length > 0 ) {
						return true;
					}
				}
			},
			{
				type: 'input',
				name: 'db_pass',
				message: 'Database Password?',
			},
			{
				type: 'input',
				name: 'db_host',
				message: 'Database Host?',
				validate: function( db_host ){
					if ( db_host.length > 0 ) {
						return true;
					}
				}
			}], function ( res ) {
				config = {
					localhost: pwd,
					wptemplate: pwd + "/wordpress-template",
					db_user: res.db_user,
					db_pass: res.db_pass,
					db_host: res.db_host
				};
				var config_log = JSON.stringify( config, null, '\t' );
				fs.writeFile( 'config.json', config_log, function ( err ) {
					if ( err ) {
						throw err;
					}
				});
				callback();
			}));
	}
});

// Asset Directory.
var assets_dir = cwd;

// Paths.
var paths = {
	sass: assets_dir + '/scss/',
	css: assets_dir + '/css/',
	js: assets_dir + '/js/',
	templates: assets_dir + '/templates/'
};

// Asset Locations.
var assets = {
	templates: [paths.templates + '**/*'],
	sass: [paths.sass + '**/*'],
	css: [paths.css + '**/*'],
	js: [paths.js + '**/*'],
};

// Compass Task.
gulp.task( 'compass', function () {
	gulp.src( paths.sass )
		.pipe( compass( {
			config_file: assets_dir + '/scss/config.rb',
			css: paths.css,
			sass: paths.sass
		}))
		.pipe( gulp.dest( paths.sass ) );
});

// Watch Task.
gulp.task( 'watch', function () {
	gulp.watch( assets.sass, ['compass'] );
	gulp.watch( assets.css, ['live-reload'] );
	gulp.watch( assets.templates, ['live-reload'] );
	gulp.watch( assets.js, ['live-reload'] );
	gulp.watch( cwd + '**/*.php', ['live-reload'] );
});

// CSS Reload.
gulp.task( 'live-reload', function () {
	browserSync.reload();
});

// Default.
gulp.task( 'default', ['serve', 'compass', 'watch'] );

gulp.task( 'install-prompt', ['build-config'], function( callback ) {
	gulp.src( 'gulpfile.js' )
		.pipe( prompt.prompt( {
			type: 'input',
			name: 'installname',
			message: 'Install Name?',
			validate: function( installname ){
				if ( installname.length > 0 ) {
					return true;
				}
			}
		}, function ( res ) {
			response = res;
			callback();
		}));
});

gulp.task( 'buildlocal', ['install-prompt'], function() {
	WP.discover( {path:cwd}, function( WP ) {
		WP.core.download( function( err,result ){ // creates a new plugin 
			console.log( result );
			WP.core.config( {
				dbname: response.installname,
				dbuser: config.db_user,
				dbpass: config.db_pass,
				dbhost: config.db_host
			}, function( err,result ){ // creates a new plugin 
				console.log( result );
			});
		});
	});
});