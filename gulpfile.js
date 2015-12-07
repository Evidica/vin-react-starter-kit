"use strict";

var gulp = require('gulp');
var open = require('gulp-open'); // Open a URL in a web browser
var sass = require('gulp-sass'); // Compiles SASS to CSS
var browserify = require('browserify'); // Wraps npm modules so they can be run in the browser
var reactify = require('reactify');  // Transforms React JSX to JS
var babelify = require('babelify');  // Compile ES6 to ES5 using the Babel transform in Browserify
var source = require('vinyl-source-stream'); // Use conventional text streams with Gulp
var concat = require('gulp-concat'); // Concatenates files
var lint = require('gulp-eslint'); // Lint JS files, including JSX
var mocha = require('gulp-mocha'); // Test JS
var babel = require('babel/register'); // Register Babel for Mocha
var debug = require('gulp-debug'); // Useful for debugging Gulp
var shell = require('gulp-shell'); // Run shell commands from within gulp
var browserSync = require('browser-sync'); // Webserver that exposes app on public IP for mobile testing
var gulpSequence = require('gulp-sequence'); // Run selected gulp tasks in sequence instead of in parallel
var del = require('del'); // Node library for deleting files and folders
var fs = require('fs'); // File system library. Built into Node.

var config = {
	port: 9005,
	devBaseUrl: 'http://localhost',
	paths: {
		html: './src/*.html',
		js: [
			'./src/**/*.js',
			'!./src/**/*.spec.js'
		],
		css: [
			'node_modules/bootstrap/dist/css/bootstrap.min.css',
			'node_modules/bootstrap/dist/css/bootstrap-theme.min.css'
		],
		coverage: 'coverage',
		tests: './src/**/*.spec.js',
		sass: './src/styles/*.scss',
		dist: './dist',
		mainJs: './src/main.js'
	}
};

//Remove the dist folder and add initial structure to assure a clean build.
gulp.task('clean', function(callback) {
  del('./dist').then(function() {
    fs.mkdir('dist', function() {
      fs.mkdir('./dist/scripts');
      fs.mkdir('./dist/styles');
    });
  });
  callback();
});

//Open the app in the user's default browser using browserSync webserver
//Watches files and reloads as they change.
gulp.task('open', ['html', 'js', 'sass', 'lint-test'], function() {
	browserSync.init({
    files: ["./dist/*.html", "./dist/**/*.js", "./dist/css/*"],
    injectChanges: true,
    codeSync: true,
		server: {
			baseDir: "./dist"
		}
	});
});

//Compile Sass
gulp.task('sass', function () {
  return gulp.src(config.paths.sass)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(config.paths.dist + '/styles/'))
    .pipe(browserSync.stream());
});

//Migrate HTML files to dist folder
gulp.task('html', function() {
	return gulp.src(config.paths.html)
		.pipe(gulp.dest(config.paths.dist));
});

//Build JS via Babel, bundle via Browserify, minify via minifyify
gulp.task('js', function() {
	//or, can run this on command line to compile babel, minify, and create separate bundle
	//browserify ./src/main.js -d -t [ babelify ] -p [minifyify --map bundle.map.json --output ./dist/scripts/bundle.map.json] > ./dist/scripts/bundle.js

	var bundler = new browserify({debug: true});
	bundler.add(config.paths.mainJs);
	bundler.transform('babelify');

	//Note that while a sourcemap is always generated,
	//this only minifies when NODE_ENV is set to prod.
	//We're not minifying for the default (dev) task to speed builds.
	//The sourcemap is always generated because it's still
	//useful even without minification so that the original ES6
	//is displayed when debugging in the browser.
	bundler.plugin('minifyify',
		{
			map: 'bundle.map.json',
			output: './dist/scripts/bundle.map.json',
			minify: process.env.NODE_ENV == 'production'
		}
	);

	bundler.bundle(function (err, src, map) {
	  // Can optionally add code here
	})
	.on('error', console.error.bind(console))
	.pipe(source('bundle.js'))
	.pipe(gulp.dest(config.paths.dist + '/scripts'));
});

//This task is potentially useful for bundling css from libraries (like KendoUI, Bootstrap, etc)
//We should use SASS to write our own stylesheets.
// gulp.task('css', function() {
// 	gulp.src(config.paths.css)
// 		.pipe(concat('bundle.css'))
// 		.pipe(gulp.dest(config.paths.dist + '/css'));
// });

//Lint JS files via ESLint
gulp.task('lint', function() {
	return gulp.src(config.paths.js)
		.pipe(lint({config: '.eslintrc'}))
		.pipe(lint.format());
});

//Run tests via Mocha with Chai
gulp.task('test', function() {
	return gulp.src(config.paths.tests)
		.pipe(mocha());
});

//Lint JS and run tests
gulp.task('lint-test', ['lint'], function() {
	return gulp.src(config.paths.tests)
		//Built-in reporters: min, spec, dot, nyan, list, progress
		//Examples: https://mochajs.org/#reporters
		.pipe(mocha({ reporter: 'dot'}));
});

/*This task simply calls a command stored in package.json.
  It uses Mocha with Istanbul to run tests and create code coverage reports.
  This version runs coverage on the code *after* it's compiled to ES5 by Babel
  This means the resulting reports in /coverage show *compiled* code.
  This makes the reports from this pretty useless, though the coverage
  numbers are generally valid.
  Advantages:
	+ Output is colored, even when run from Gulp
	+ More friendly error messages than ES6 version below when code can't be compiled
	+ Doesn't display a spurious error message like Isparta does on the es6 task.

  Disadvantages:
  	- Code coverage is on the *compiled* code, instead of the code you wrote, so numbers aren't quite accurate.
  	- Hard to read the resulting reports since it's compiled code.

	Alternative approach at https://gist.github.com/cgmartin/599fefffd6baa161c615
*/
gulp.task('coverage-es5', shell.task(['npm run coverage-es5']));

/*This task simply calls a command stored in package.json.
  This version runs coverage on the code *before* it's compiled to ES5 by Babel
  It uses Isparta, which is a wrapper over Istanbul project that supports code coverage for ES6.
  Since this shows code coverage numbers on the code you wrote, it should be used as the default
  because its stats are obviously most accurate. However, if you're having issues, the test task
  above often produces more useful error messages, but with slightly less accurate code coverage
  information since the code coverage is calculated on the compiled ES5 code instead of the ES6 you wrote.
  Note: This command throws a "transformation error" because I have to reference the full path to _mocha
  in this command to make windows happy (see the coverage-es6 task in package.json). On Mac, I can
  run _mocha without a path just fine because it lands properly in .bin there.
  Istanbul may add a preloader for ES6 in the future. https://github.com/douglasduteil/isparta/issues/31
  Advantages:
	+ Reports in coverage show the actual code you wrote (instead of your code compiled down to ES5).

  Disadvantage:
    - Isparta is currently throwing an error, which you can ignore. It doesn't impact the app or report.
   Should be able to drop Isparta once Istanbul adds native ES6 support in 1.0: https://github.com/gotwarlost/istanbul/issues/212
   Working example using 1.0 alpha: https://github.com/istanbuljs/sample-babel-node
*/
gulp.task('coverage-es6', shell.task(['npm run coverage-es6']));

//Open code coverage information in the browser
gulp.task('open-coverage', ['coverage-es6'], function() {
	gulp.src('coverage/lcov-report/index.html')
		.pipe(open());
});

gulp.task('lint-test-cover', ['lint-test', 'coverage-es6']);

//Watch files and re-run tasks
gulp.task('watch', function(callback) {
  gulp.watch(config.paths.html, ['html']);
  gulp.watch(config.paths.js, ['js', 'lint-test']);
  gulp.watch(config.paths.tests, ['lint-test']);
  gulp.watch(config.paths.sass, ['sass']);
  callback();
});

//Sets environment variable so production specific steps (like minifying JS) are completed.
gulp.task('setup-prod-environment', function (callback) {
  process.stdout.write("Setting NODE_ENV to 'production'" + "\n");
  process.env.NODE_ENV = 'production';
  if (process.env.NODE_ENV != 'production') {
      throw new Error("Failed to set NODE_ENV to production!");
  }

  callback();
});

//Default Gulp Task. Runs when you simply type `gulp`. Useful for development.
gulp.task('default', gulpSequence('clean', 'open', 'watch'));

//Prepares app for prod deployment by doing additional things like minifying JS.
//This task should be run before committing code.
gulp.task('build', gulpSequence(['clean', 'setup-prod-environment'], 'open', 'watch', 'open-coverage'));
