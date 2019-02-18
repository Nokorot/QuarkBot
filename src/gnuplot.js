/*
* Based on node-gnuplot, https://github.com/davvo/node-gnuplot
*/

const fs = require("fs");
const util = require("util");
var run = require('comandante');

const dbDataObj = require('./dropbox_data_obj')
const pauseObj = dbDataObj.insts["Pause"];

let confObj = new dbDataObj("GnuplotConfig", "gnuplot-conf.json", process.env.DEBUG);

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

function handleLineSyle(code, threadID){
	line_styles = [
		('linewidth', 'lw'),
		('linecolor', 'rgb'),
		('dashtype', 'dt')
	]

	const data = confObj.data[message.threadID];
	line_styles.forEach((name, key) => {
		if (code.indexOf(key) >= 0);
		else if (data['line_style'][name]) {
			code += " " + key + " " + data['line_style'][name]
		}
	})
}

function handleGeneralPlotConfigs(threadID, gnuplot, code) {
	const data = confObj.data[threadID];
	if (!data) return;

	if (data['ranges'])
		Object.keys(data['ranges']).forEach((range) => {
				gnuplot.set(range + " " + data['ranges'][range]);
		});

	if (data['title'])
		gnuplot.set("title " + data['title']);

	const ls = data['line_style'];
	if (ls) {
		var i;
		for (i = 0; i < code.split(',').length; i++) {
			if (ls['lw']) {
				gnuplot.set(util.format("linetype %d lw %s", i+1, data['line_style']['lw']));
			} else {
				gnuplot.set(util.format("linetype %d lw %s", i+1, '3'));
			}
			if (ls['lc'] &&  ls['lc'].length > i) {
				gnuplot.set(util.format("linetype %d lc rgb %s", i+1, data['line_style']['lc'][i]));
			}
			/*if (ls['dt'] &&  typeof(ls['dt']) == 'string') {
				gnuplot.set(util.format("linetype %d dt %s", i+1, data['line_style']['rgb']));
			} else */
			if (ls['dt'] &&  ls['dt'].length > i) {
				gnuplot.set(util.format("linetype %d dt %s", i+1, data['line_style']['dt'][i]));
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

function unset(api, message, code) {
	if (pauseObj.data[message.threadID]) return;
	if(!confObj.data[message.threadID]) return;

	const data = confObj.data[message.threadID];
	if(!data['line_style'])
		data['line_style'] = {};

	switch (code[0]) {
		case "linewidth": code[0] = 'lw'; break;
		case "linecolour":
		case "linecolor": code[0] = 'lc'; break;
		case "dashtype":  code[0] = 'dt'; break;
		default:
	}

	switch (code[0]) {
		case "lw":
		case "lc":
		case "dt":
			if(data['line_style'])
				delete data['line_style'][code[0]];	break;

		case "linestyle":
			delete data['line_style']; break;

		case "title":
			delete data['title']; break;

		case "xrange":
		case "yrange":
		case "zrange":
			if(data['ranges'])
				delete data['ranges'][code[0]]; break;

		case "ranges":
			delete data['ranges']; break;

		case "all":
			delete confObj.data[message.threadID]; break;

		default:
	}
		console.log(confObj.data[message.threadID]);
}

function set(api, message, code) {
		if (pauseObj.data[message.threadID]) return;

		if(!confObj.data[message.threadID])
			confObj.data[message.threadID] = {};
		const data = confObj.data[message.threadID];

		switch (code[0]) {
			case "linewidth": code[0] = 'lw'; break;
			case "linecolour":
			case "linecolor": code[0] = 'lc'; break;
			case "dashtype":  code[0] = 'dt'; break;
			default:
		}

		switch (code[0]) {
			case "lw":
			case "lc":
			case "dt":
				if(!data['line_style'])
					data['line_style'] = {};
				data['line_style'][code[0]] = code[1].split(',');
				break;

			case "title":
				var title = code.slice(1).join(" ");
				if (title.match(/\'*\'/) || title.match(/\"*\"/))
					data['title'] = title;
				else data['title'] = "\""+title+"\"";
				break;

			case "xrange":
			case "yrange":
			case "zrange":
				if(!data['ranges'])
					data['ranges'] = {};
				if (code[1].match(/\[*:*\]/))
					data['ranges'][code[0]] = code[1];
				else  data['ranges'][code[0]] = '\[' + code[1] + '\]';
				break;

			default:
		}
}

function plot(api, message, code, body) {
	if (pauseObj.data[message.threadID]) return;

	console.log(body);
	//var plot_code = handleLineSyle(code.join(' '), message.threadID);

	var plot_code = code.join(' ');

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

	var plot_code = code.join(' ');

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

	var plot_code = code.join(' ');

	var writer = fs.createWriteStream('tmp/implot.png');
	var gplot = gnuplot(api, message)
				.set('term png size 400,300');

	handleImpPlot(message.threadID, gplot, plot_code);

	gplot.pipe(writer)
			 .on('finish', () => sendPlot(api, message, 'tmp/implot.png'));
}

function handleCommands(api, message, code, body) {
	var commands = {
		'\\plot': plot,
		'\\splot': splot,
		'\\implot': implot,
		'\\unset': unset,
		'\\set': set
	};
	var cmd = commands[code[0].trim().toLowerCase()];
	if (cmd) {
		var i;
		for (i = 1; i < code.length; i++)
			if (commands[code[i].trim().toLowerCase()]) break;

		cmd(api, message, code.slice(1,i), body);
		if (i < code.length)
			handleCommands(api, message, code.slice(i), []);
		return true;
	}
	return false;
}

module.exports = {
	handleCommands: handleCommands
}
