/** Require Libraries. */

var gulp = require( 'gulp' ),
	path = require( 'path' ),
	prompt = require( 'gulp-prompt' ),
	replace = require( 'gulp-replace' ),
	compass = require( 'gulp-compass' ),
	git = require( 'gulp-git' ),
	del = require( 'del' ),
	livereload = require( 'gulp-livereload' ),
	fs = require( 'fs' ),
	rename = require( 'gulp-rename' );

// Current Working Directory.
var cwd = process.env.INIT_CWD;

// Project Working Directory.
var pwd = __dirname;

// System Variables.
var config;
var response;

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
				validate: function( db_pass ){
					if ( db_pass.length > 0 ) {
						return true;
					}
				}
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
	livereload.listen();
	gulp.watch( assets.sass, ['compass'] );
	gulp.watch( assets.css, ['live-reload'] );
	gulp.watch( assets.templates, ['live-reload'] );
	gulp.watch( assets.js, ['live-reload'] );
	gulp.watch( cwd + '**/*.php', ['live-reload'] );
});

// CSS Reload.
gulp.task( 'live-reload', function () {
	gulp.src( paths.css )
		.pipe( livereload() );
});

// Default.
gulp.task( 'default', ['compass', 'watch'] );

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
			// Check if a local version of the WordPress repo exisits. If not, build one.
			if ( ! fs.existsSync( './wordpress-template' ) ) {
				git.clone( 'https://github.com/WordPress/WordPress.git', {args: '--depth 1 ./wordpress-template'}, function (err) {
					if ( err ) {
						throw err;
					}
					callback();
				});
			} else {
				callback();
			}
		}));
});

gulp.task( 'copytocwd', ['install-prompt'], function(callback) {
	// Move files from a local template install into your current folder.
	gulp.src([
		config.wptemplate + '/**/*',
		'!' + config.wptemplate + '/wp-content/**/**',
		'!' + config.wptemplate + '/wp-config.php',
	])
	.pipe( gulp.dest( cwd ) )
	.on( 'end', callback );
});

gulp.task( 'buildlocal', ['build-config', 'install-prompt', 'copytocwd'], function() {
	if ( ! fs.existsSync( cwd + '/wp-config.php' ) ) {
		fs.readFile(cwd + '/wp-config-sample.php', 'utf8', function (err,data) {
			if ( err ) {
				throw err;
			}
			var result = data.replace( "define('DB_NAME', 'database_name_here');", "define('DB_NAME', '" + response.installname + "');" )
						.replace( "define('DB_USER', 'username_here');", "define('DB_USER', '" + config.db_user + "');" )
						.replace( "define('DB_PASSWORD', 'password_here');", "define('DB_PASSWORD', '" + config.db_pass + "');" )
						.replace( "define('DB_HOST', 'localhost');", "define('DB_HOST', '" + config.db_host + "');" );
			fs.writeFile(cwd + '/wp-config.php', result, 'utf8', function (err) {
				if ( err ) {
					throw err;
				}
			});
		});

	}
});

// Live Reload Snippet
// <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>