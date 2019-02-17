
const fs = require("fs");
//var gnuplot = require('gnuplot')

const dbDataObj = require('./dropbox_data_obj')
const pauseObj = dbDataObj.insts["Pause"];

var run = require('comandante');

function gnuplot(api, message) {
    var plot = run('gnuplot/bashrc', []);

		plot.on('error', (err) => {
			console.log(err.toString());
			const e = err.toString().split('line 0: ')[1]);

			api.sendMessage(e, message.threadID);
		})

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


function sendPlot(api, message, file) {
	api.sendMessage({
		body: "",
		attachment: fs.createReadStream("plot.png")
	}, message.threadID);
}

module.exports = {
	// handle commands:
	plot: function(api, message, code) {
		if (pauseObj.data[message.threadID]) return;

		var writer = fs.createWriteStream('plot.png');
		var gplot = gnuplot(api, message)
					.set('term png size 400,300')
					.plot(code.join(' '), {end: true})
					.pipe(writer)
					.on('finish', () => sendPlot(api, message, 'plot.png'));
	},

	splot: function(api, message, code) {
		if (pauseObj.data[message.threadID]) return;

		var writer = fs.createWriteStream('plot.png size 400,300');
		var gplot = gnuplot()
					.set('term png')
					.plot(code.join(' '), {end: true})
					.pipe(writer)
					.on('finish', () => sendPlot(api, message, 'plot.png'));
	}
}
