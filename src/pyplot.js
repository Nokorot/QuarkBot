
const fs = require("fs");
const util = require("util")
const run = require('comandante');

const dbDataObj = require('./dropbox_data_obj')
const pauseObj = dbDataObj.insts["Pause"];

let plotConfObj = dbDataObj.insts["PlotConfig"];

function genpyplot(api, message) {
		var plot = run('python3', ['./src/pyplot.py']);

		plot.on('error', (err) => {
			console.error(err.toString());
			api.sendMessage("pyplot-err: " + err.toString().split('line 0: ')[1], message.threadID);
		});

    plot.print = function (data, options) {
				plot.write(data);
        if (options) {
            plot.end();
        }
    };

    plot.println = function (data, options) {
        plot.print(data + '\n', options);
    };

		plot.exit = function (callback) {
				plot.on('exit', callback);
			  plot.println('exit');
		};

    ['set', 'plot', 'splot', 'implot'].forEach(function (name) {
        plot[name] = function (data, options) {
            plot.println(name + ((data) ? (' ' + data) : ''), options);
        };
    });

    return plot;
};

function handleGeneralPlotConfigs(threadID, pyplot, code) {
	const data = plotConfObj.data[threadID];
	if (!data) return;

	if (data['ranges'])
		pyplot.set('ranges ' + JSON.stringify(data['ranges']));

	if (data['title'])
		pyplot.set("title " + data['title']);

	const ls = data['line_style'];
	if (ls) {
		line_style = {};
		if (ls['lw']) line_style['linewidth'] = ls['lw'];
		if (ls['lc']) line_style['linecolor'] = ls['lc'];
		if (ls['dt']) line_style['dashtype']  = ls['dt'];
		pyplot.set('linestyle ' + JSON.stringify(line_style))
	}

}

function sendPlot(api, message, file) {
	console.log(file, message.threadID);
	api.sendMessage({
		body: "",
		attachment: fs.createReadStream(file)
	}, message.threadID);
}

function plot(api, message, code, callback) {
	if (pauseObj.data[message.threadID]) return;

	var plot_code = code.join(' ');

	var pyplot = genpyplot(api, message);
	pyplot.set('output png size 400,300 tmp/plot.png');

	handleGeneralPlotConfigs(message.threadID, pyplot, plot_code);

	pyplot.plot(plot_code);
	pyplot.exit((err_code) => {
		if (err_code === 0)
			sendPlot(api, message, 'tmp/plot.png');
	});
}

function splot(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	var plot_code = code.join(' ');

	var pyplot = genpyplot(api, message);
	pyplot.set('output png size 400,300 tmp/splot.png');

	handleGeneralPlotConfigs(message.threadID, pyplot, plot_code);

	pyplot.splot(plot_code);
	pyplot.exit((err_code) => {
		if (err_code === 0)
			sendPlot(api, message, 'tmp/splot.png');
	});
}

function implot(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	var plot_code = code.join(' ');

	var pyplot = genpyplot(api, message);
	pyplot.set('output png size 400,300 tmp/implot.png');

	handleGeneralPlotConfigs(message.threadID, pyplot, plot_code);

	pyplot.implot(plot_code);
	pyplot.exit((err_code) => {
		if (err_code === 0)
			sendPlot(api, message, 'tmp/implot.png');
	});
}

function animante(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	api.sendMessage("animante splot is not yet implemented for pyplot", message.threadID);
}

module.exports = {
	plot: 		plot,
	splot: 		splot,
	implot: 	implot,
	animante: animante
}
