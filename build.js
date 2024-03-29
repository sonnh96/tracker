'use strict'

const { writeFile } = require('fs').promises
const js = require('rosid-handler-js')

js('src/scripts/main.js', {

	optimize: true,
	browserify: {
		standalone: 'sol-tracker'
	}

}).then((data) => {

	return writeFile('dist/sol-tracker.min.js', data)

})