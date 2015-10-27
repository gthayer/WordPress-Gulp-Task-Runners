//Require Libraries
var gulp = require('gulp'),
	path = require('path'),
	prompt = require('gulp-prompt'),
	replace = require('gulp-replace'),
	compass = require('gulp-compass'),
	livereload = require('gulp-livereload');

//System Specific Variables
var localhost = '/home/gary/svn',
	wptemplate = '/home/gary/svn/wp-template';

//Install Specific Variables
var pwd = process.env.PWD;

gulp.task('compass', function() {
  gulp.src(pwd + '/scss/')
	.pipe(compass({
		config_file: pwd + '/scss/config.rb',
		css: pwd + '/css',
		sass: pwd + '/scss',
	}))
	.pipe(gulp.dest(pwd + '/css'));
});
 
gulp.task('watch', function() {

  livereload.listen();
  gulp.watch(pwd + '/scss/**/*', ['compass']);
  gulp.watch(pwd + '/css/**/*', ['css-reload']);
  gulp.watch(pwd + '/**/*.php', ['css-reload']);
  gulp.watch(pwd + '/**/*.js', ['css-reload']);
 
});

gulp.task('css-reload', function() {
  gulp.src(pwd + '/css')
  .pipe(livereload());
});

gulp.task('default', ['compass', 'watch']);

/***
 * Install Wordpress into a folder, ignoring wp-content files
 */
gulp.task('buildlocal', function() {

	gulp.src('gulpfile.js')
		.pipe(prompt.prompt({
			type: 'input',
			name: 'installname',
			message: 'Install Name?'
		}, function(res){

			if (res.installname) {

				//Move files from a local template install into your current folder
				gulp.src([
						wptemplate + '/**/*',
						'!'+wptemplate+'/wp-content/**/*',
						'!'+wptemplate+'/wp-config.php',
					])
					.pipe(gulp.dest(pwd));

				//Replace wp-config with a file for your localhost database
				gulp.src([wptemplate + '/wp-config.php'])
					.pipe(replace( "define('DB_NAME', 'wp-template');" , "define('DB_NAME', '"+ res.installname +"');" ))
					.pipe(gulp.dest(pwd));

			} else {
				//Error message if input is left blank
				console.log('ERROR: Please enter an install name');
			}

		}));
});


//Live Reload Snippet
// <script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></' + 'script>')</script>