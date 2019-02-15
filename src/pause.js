
const dbDataObj = require('./dropbox_data_obj')

const pause = new dbDataObj("Pause", "threads/pause.json", process.env.DEBUG);

module.exports = {
  pause_thread: function (api, message, code) {
  	pause.data[message.threadID] = true;
  	console.log("Quark Bot is PAUSED!");
  	api.sendMessage("Quark Bot is PAUSED!\nUse \"\\quark unpause\" to enable it aigain.", message.threadID);
  },

  unpause_thread: function (api, message, code) {
  	pause.data[message.threadID] = false;
  	console.log("Quark Bot is ENABLED!");
  	api.sendMessage("Quark Bot is ENABLED!", message.threadID);
  }
}
