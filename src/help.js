
const fs = require("fs");

String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function sendHelpMessage(api, threadID, file) {
  fs.readFile(file, {encoding: 'utf8'}, (err, res) => {
		if (!err) {
			res.split('::newmessage').forEach( (msg) => {
				var attach = msg.regexIndexOf(new RegExp('::attachment\(.*\)'), 0);
				if (attach > 0) {
					attach_file = msg.substring(attach+'::attachment\('.length, msg.indexOf("\)", attach));
					console.log( attach_file );
					msg = {
						'body': msg.replace(new RegExp('::attachment\(.*\)'), ''),
						'attachment': fs.createReadStream( attach_file )
					};
				}
				api.sendMessage(msg, threadID);
			});
		} else {
			console.log(err);
		}
	});
}

module.exports = {
  sendHelpMessage: sendHelpMessage,

  handleCommands: function(api, message, code) {
  	file = "res/help/" + {
  					undefined: 'main',
  					'latex': "latex",
  					'getdefines': "getdefines",
  					'define': "define-undefine",
  					'undefine': "define-undefine",
  					'pause': "pause-unpause",
  					'unpause': "pause-unpause",
  					'getdefaultdefines': "getdefaultdefines",
					'plot': "plot",
					'splot': "splot",
					'implot': "implot",
					'set': "set",
					'unset': "unset"
  	}[code[0]] + ".txt";

    if (!file)
      api.sendMessage("Command Unknown: " + code[0]);
    else
      sendHelpMessage(api, message.threadID, file);
  }
}
