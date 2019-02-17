
const fs = require("fs");
//var gnuplot = require('gnuplot')


var run = require('comandante');

function gnuplot() {
    var plot = run('gnuplot/bashrc', []);

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






module.exports = {
	// handle commands:
	plot: function(api, message, code) {
		//if (pauseObj.data[message.threadID]) return;
	  const msg = message.body;

		gnuplot()
			.set('term png')
			.set('output "plot.png"')
			.set('title "Some Math Functions"')
			.set('xrange [-10:10]')
			.set('yrange [-2:2]')
			.plot('(x/4)**2, sin(x), 1/x')
			.end();

		//mathjax.tex2png(code, (path) => {
    api.sendMessage({
      body: "",
      attachment: fs.createReadStream("plot.png")
    }, message.threadID);
    //});
	},
}
