var through = require('through2');
var dot = require('dot');
var gutil = require('gulp-util');
var _ = require('lodash');
var path = require('path');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-dotify';

function getTemplateName(root, name, extension, separator) {
	var i = name.lastIndexOf(root);
  if (i !== -1) {
    name = name.slice(i + root.length);
  }
  var trimRx = new RegExp('^\\' + path.sep + '|\\' + path.sep + '$', 'g');
  var parts = name.replace(trimRx, '').split(path.sep);
  i = parts.length - 1;
	parts[i] = path.basename(parts[i], extension);
	return parts.join(separator);
}


function getTemplateCode(content) {
	return dot.template(content).toString();
}

function readStream(stream, done) {
	var buffer = '';
	stream.on('data', function (chunk) {
		buffer += chunk;
	}).on('end', function () {
		done(null, buffer);
	}).on('error', function (error) {
		done(error);
	});
}

function gulpDotify(options) {
	options = options || {};
	_.defaults(options, {
		root: 'views',
		separator: '-',
		extension: '.html',
		dictionary: 'JST'
	});
	var stream = through.obj(function (file, enc, callback) {
		var complete = function (error, contents) {
			if (error) {
				this.emit('error', new PluginError(PLUGIN_NAME, error));
			}
			try {
				var name = getTemplateName(options.root, file.path, options.extension, options.separator);
				var code = getTemplateCode(contents);
				file.contents = new Buffer([options.dictionary, '["', name, '"] = ', code, ';'].join(''));

				this.push(file);
				return callback();
			}
			catch (exception) {
				this.emit('error', new PluginError(PLUGIN_NAME, exception));
			}
		}.bind(this);

		if (file.isBuffer()) {
			complete(null, file.contents.toString());
		} else if (file.isStream()) {
			readStream(file.contents, complete);
		}
	});
	return stream;
};

module.exports = gulpDotify;
