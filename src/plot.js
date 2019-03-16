
const dbDataObj = require('./dropbox_data_obj')
const pauseObj = dbDataObj.insts["Pause"];

let confObj = new dbDataObj("PlotConfig", "plot-conf.json", process.env.DEBUG);

const pyplot = require('./pyplot');
const gnuplot = require('./gnuplot');

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
				data['title'] = title; // TODO: .replace("'", "\\'")
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

function use(api, message, code) {
	if (pauseObj.data[message.threadID]) return;

	if(!confObj.data[message.threadID])
		confObj.data[message.threadID] = {};
	const data = confObj.data[message.threadID];

	switch (code[0]) {
		case "pyplot":  data['plot_api'] = 'pyplot';  break;
		case "gnuplot": data['plot_api'] = 'gnuplot'; break;
		default: break;
	}
}

function handleCommands(api, message, code, body) {
	var commands = {
		'\\unset': unset,
		'\\set': set,
		'\\use': use
	};

	const data = confObj.data[message.threadID];
	if (!data || !data['plot_api'] || data['plot_api'] != "gnuplot") {
		commands['\\plot']     = pyplot.plot;
		commands['\\splot']    = pyplot.splot;
		commands['\\implot']   = pyplot.implot;
		commands['\\animate']  = pyplot.animate;
  } else { // otherwise use pyplot.
		commands['\\plot']     = gnuplot.plot;
		commands['\\splot']    = gnuplot.splot;
		commands['\\implot']   = gnuplot.implot;
		commands['\\animate']  = gnuplot.animate;
	}

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
