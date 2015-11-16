# VinSolutions JavaScript Starter Kit
This is a starter kit for building a new React project at VinSolutions. The goal: Make it easy to start a robust new client-side app using modern tooling:

* [React](https://facebook.github.io/react/) for rich, fast, client-side components  
* [Babel](http://babeljs.io) for compiling ES6 to ES5, so we can enjoy the new version of JavaScript today  
* [Browserify](http://browserify.org/) for bundling all JS including npm packages for use in the browser  
* [Mocha](http://mochajs.org) for automated tests with [Chai](http://chaijs.com/) for assertions
* [Istanbul](https://github.com/gotwarlost/istanbul) for code coverage data
* [TrackJS](http://trackjs.com) for JS error tracking in production  
* [ESLint](http://eslint.org/) for linting JS  
* [SASS](http://sass-lang.com/) for styling  
* [Gulp](http://gulpjs.com) glues all this together in a handy automated build

The starter kit includes a working example app that puts all of the above to use.

# Get Started
1. Clone the project from GitHub
2. `npm install`
3. `gulp`

# Testing
Streamlined automated testing is a core feature of this starter kit. All tests are placed in files that end in .spec.js. They are placed in the same directory as the file under test. Why?
+ The existence of tests is highly visible
+ Easy to open since they're in the same folder as the file you're working with
+ Easy to create new test files when creating new source files
+ Short import paths are easy to type and less brittle. 
+ As files are moved, it's easy to move tests alongside.

