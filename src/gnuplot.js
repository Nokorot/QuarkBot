/*
* Based on node-gnuplot, https://github.com/davvo/node-gnuplot
*/

const fs = require("fs");
const util = require("util");
var run = require('comandante');

const dbDataObj = require('./dropbox_data_obj')
const pauseObj = dbDataObj.insts["Pause"];

let plotConfObj = dbDataObj.insts["PlotConfig"];

function gnuplot(api, message) {
    var plot = run('gnuplot/bashrc', []);

		plot.on('error', (err) => {
			console.error(err.toString());
			api.sendMessage("gnuplot-err: " + err.toString().split('line 0: ')[1], message.threadID);
		});

    plot.print = function (data, options) {
				plot.write(data);
        if (options && options.end) {
            plot.end();
        }
        return plot;
    };

    plot.println = function (data, options) {
        return plot.print(data + '\n', options);
    };

		/*plot.setf = function(data) {
			plot.set(util.format(data, arguments.slice(1)));
		}*/

    ['set', 'unset', 'plot', 'splot', 'replot'].forEach(function (name) {
        plot[name] = function (data, options) {
            if (data) {
                return plot.println(name + ' ' + data, options);
            }
            return plot.println(name, options);
        };
    });

    return plot;
};

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
function formatCode(code) {
	const rm = ['\\left', '\\right', '\\'];

	code = code.replaceAll()
	rm.forEach((key) => { code = code.replaceAll(key, " "); });
	return code.replaceAll("^", "**");
}

function handleGeneralPlotConfigs(threadID, gnuplot, code) {
	const data = plotConfObj.data[threadID];
	if (!data) return;

	if (data['ranges'])
		Object.keys(data['ranges']).forEach((range) => {
				gnuplot.set(range + " " + data['ranges'][range]);
		});

	if (data['title'])
		gnuplot.set("title \'" + data['title'] + "\'");

	const ls = data['line_style'];
	if (ls) {
		var i;
		for (i = 0; i < code.split(',').length; i++) {
			if (ls['lw']) {
				gnuplot.set(util.format("linetype %d lw '%s'", i+1, data['line_style']['lw']));
			} else {
				gnuplot.set(util.format("linetype %d lw '%s'", i+1, '3'));
			}
			if (ls['lc'] &&  ls['lc'].length > i) {
				gnuplot.set(util.format("linetype %d lc rgb '%s'", i+1, data['line_style']['lc'][i]));
			}
			/*if (ls['dt'] &&  typeof(ls['dt']) == 'string') {
				gnuplot.set(util.format("linetype %d dt %s", i+1, data['line_style']['rgb']));
			} else */
			if (ls['dt'] &&  ls['dt'].length > i) {
				gnuplot.set(util.format("linetype %d dt '%s'", i+1, data['line_style']['dt'][i]));
			}
		}
	}
}

function handleSPlotConfigs(threadID, gnuplot, code) {
	handleGeneralPlotConfigs(threadID, gnuplot, code);
}

function handlePlotConfigs(threadID, gnuplot, code) {
	handleGeneralPlotConfigs(threadID, gnuplot, code);
}

function handleImpPlot(threadID, gnuplot, code) {
	gnuplot.set('contour');
	gnuplot.set('cntrparam levels discrete 0');
	gnuplot.set('isosample 100');
	gnuplot.unset('surface');

	handleGeneralPlotConfigs(threadID, gnuplot, code);

	gnuplot.set('table $implotdatablock');
	gnuplot.splot(code.replace('=', '-'));
	gnuplot.unset('table');
	gnuplot.set('size ratio -1');
	gnuplot.plot('$implotdatablock with lines title ""', {end: true});
}

function sendPlot(api, message, file) {
	api.sendMessage({
		body: "",
		attachment: fs.createReadStream(file)
	}, message.threadID);
}

function plot(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	// console.log(body);

	var plot_code = formatCode(code.join(' '));

	var writer = fs.createWriteStream('tmp/plot.png');
	var gplot = gnuplot(api, message)
				.set('term png size 400,300');

	handlePlotConfigs(message.threadID, gplot, plot_code);

	gplot.plot(plot_code, {end: true});
	gplot.pipe(writer)
			 .on('finish', () => sendPlot(api, message, 'tmp/plot.png'));
}

function splot(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	var plot_code = formatCode(code.join(' '));

	var writer = fs.createWriteStream('tmp/splot.png');
	var gplot = gnuplot(api, message)
				.set('term png size 400,300');

	handleSPlotConfigs(message.threadID, gplot, plot_code);

	gplot.splot(plot_code, {end: true});
	gplot.pipe(writer)
			 .on('finish', () => sendPlot(api, message, 'tmp/splot.png'));
}

function implot(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	var plot_code = formatCode(code.join(' '));

	var writer = fs.createWriteStream('tmp/implot.png');
	var gplot = gnuplot(api, message)
				.set('term png size 400,300');

	handleImpPlot(message.threadID, gplot, plot_code);

	gplot.pipe(writer)
			 .on('finish', () => sendPlot(api, message, 'tmp/implot.png'));
}

function animate(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	api.sendMessage("Sorry, the gnuplot doesn't suport animations yet, pleas use pyplot", message.threadID);
}

module.exports = {
	plot: 		plot,
	splot: 		splot,
	implot: 	implot,
	animate: animate
}
