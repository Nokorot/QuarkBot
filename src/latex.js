
const fs = require("fs");
const defines = require('./defines')
const mathjax = require('./mathjax')

const dbDataObj = require('./dropbox_data_obj')
const pauseObj = dbDataObj.insts["Pause"];

const latex_compiler_obj = JSON.parse(fs.readFileSync("res/completions.json"));
const latex_compiler_keys = Object.keys(latex_compiler_obj).sort().reverse();

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function latex_unicode_compiler(code){
  if (!code) return code;
  latex_compiler_keys.forEach((key) => {
    search = (key.startsWith('^') || key.startsWith('_')) ? key : "\\"+key;
    code = code.replaceAll(search, latex_compiler_obj[key]);
  });
  return code;
}

function latex_message(api, message, msgcode, msgbody){
  if (pauseObj.data[message.threadID]) return;
	/*console.log(body);*/

	var body = latex_unicode_compiler(defines.handleDefines(
                      message, msgbody.join(' ') ));
  var code = defines.handleDefines( message, msgcode.join(' ') );

  /*const msg = message.body;
  var body = latex_unicode_compiler(defines.handleDefines(
                  message, msg.substring(0, msg.indexOf('\\latex')) ));
  var code = defines.handleDefines( message, msg.substring(
                  msg.indexOf('\\latex')+'\\latex'.length, msg.length) );*/
  if (code && code.length > 1){
    mathjax.tex2png(code, "tmp/latex.png", () => {
        api.sendMessage({
          body: body,
          attachment: fs.createReadStream("tmp/latex.png")
        }, message.threadID);
    });
  } else {
    api.sendMessage(body, message.threadID);
  }
}

function getlatexchars(api, message, code) {
	api.sendMessage({
		attachment: fs.createReadStream("res/completions.json")
	}, message.threadID, (err, res) => {
		console.error(err.error);
	});
}

function handleCommands(api, message, code, body) {
	var cmd = {
		'\\latex': latex_message,
	}[code[0]];
	if (cmd) {
		cmd(api, message, code.slice(1), body);
		return true;
	}
	return false;
}

module.exports = {
	handleCommands: handleCommands,

  message: latex_message,
	getlatexchars: getlatexchars,
	unicode_compiler: latex_unicode_compiler
}
