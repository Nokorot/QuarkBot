
const dbDataObj = require('./dropbox_data_obj')

let defines = new dbDataObj("Defines", "threads/defines.json", process.env.DEBUG);
let pdefines = new dbDataObj("PDefines", "pdefines.json", process.env.DEBUG);

module.exports = {
	handleDefines: function(message, msg) {
		if (message.isGroup) {
			var defs = defines.data[message.threadID];
			if (defs) Object.keys(defs).forEach((key) => {
				msg = msg.replace(key, defs[key]);
			});
		}
		defs = pdefines.data[message.senderID];
		if (defs) Object.keys(defs).forEach((key) => {
			msg = msg.replace(key, defs[key]);
		});

		return msg;
	},

	// handle commands:
	getdefines: function(api, message, code) {
		if (message.isGroup) {
			const defs = defines.data[message.threadID]
			if (defs && Object.entries(defs).length > 0) {
				var s = Object.entries(defs).map((e)=> e[0] + ": \t" + e[1]).join('\n');
				api.sendMessage("Local defines:\n" + s, message.threadID);
			}
			else api.sendMessage('There are no defines bound to this thread! Use "\\help define" to learn how', message.threadID);
		} else {
			const defs = pdefines.data[message.threadID];
			if (defs && Object.entries(defs).length > 0) {
				var s = Object.entries(defs).map((e)=> e[0] + ": \t" + e[1]).join('\n');
				api.sendMessage("Your global defines:\n" + s, message.threadID);
			}
			else api.sendMessage('You have no global defines. Use "\\help define" to learn how!', message.threadID);
		}
	},

	newDefine: function(api, message, code){
		const define_value = code.slice(1).join(' ');
		if (message.isGroup) {
			if (!defines.data[message.threadID]) defines.data[message.threadID] = {};
			defines.data[message.threadID][code[0]] = define_value;
			api.sendMessage("\""+code[0]+"\" is defined", message.threadID);
		} else {
			if (!pdefines.data[message.senderID]) pdefines.data[message.senderID] = {};
			pdefines.data[message.senderID][code[0]] = define_value;
			api.sendMessage("\""+code[0]+"\" is defined globaly", message.senderID);
		}
	},

	undefine: function(api, message, code){
		if (message.isGroup) {
			delete defines.data[message.threadID][code[0]];
			api.sendMessage("\""+code[0]+"\" is undefined", message.threadID);
		} else {
			delete pdefines.data[message.threadID][code[0]];
			api.sendMessage("global \""+code[0]+"\" is undefined", message.threadID);
		}
	},

	undefineall: function(api, message, code){
		if (message.isGroup) {
			delete defines.data[message.threadID];
			api.sendMessage("All your defenitions are now gone", message.threadID);
		} else {
			delete pdefines.data[message.threadID];
			api.sendMessage("All your global defenitions are now gone", message.threadID);
		}
	}
}
