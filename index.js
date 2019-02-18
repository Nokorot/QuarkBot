const login = require("facebook-chat-api");
const express = require('express')
const path = require('path')
const fs = require("fs");

const dbDataObj = require('./src/dropbox_data_obj')
const pause = require('./src/pause')
const defines = require('./src/defines')
const gnuplot = require('./src/gnuplot')
const latex = require('./src/latex')
const help = require('./src/help')

const pauseObj = dbDataObj.insts["Pause"];

const PORT = process.env.PORT || 5000
const DEBUG = process.env.DEBUG;

var log = require("npmlog");
log.pause();

// TODO Sign-in based on environment key insted.
const details = fs.readFileSync('fblatexbot-appstate.json', 'utf8');
function main() {
	dbDataObj.db_pull_all();
	web_interface()

	login({appState: JSON.parse(details)}, (err, api) => {
		setInterval(() => { handleMessageRequests(api) }, 10*1000); // Every 10 second

		api.setOptions({listenEvents: true})
		console.log("Starting to listen for messages");
		api.listen((err, event) => {
			if (err) return;
			try {
				switch (event['type']) {
					case 'message':
						onMassage(api, event);
						break;
					case 'typ': break;
					case 'read_receipt': break;
					default:
						console.log(event);
				}
			}catch (e) {
				console.log(e);
			}
		});
	});
	setInterval(dbDataObj.db_push_all, DEBUG ? 100*1000 : 300*1000) // Every 5 minute
	setInterval(CeepAlive, 600*1000);  // Every 10 minutes
}

function handleMessageRequests(api) {
	api.getThreadList(100, null, ['PENDING'], (err, list) => {
		list.forEach((req)=>{
			console.log("Accseprint Message Requast: " + req.threadID);
			api.handleMessageRequest(req.threadID, true);
			// move to handleNewChat:
			api.sendMessage(req.threadID, approveMessage)
			onMassage(api, {
				type: 'message',
				body: req.snippet,
				threadID: req.threadID,
				messageID: '',
				attachment: [],
				mentions: {},
				timestamp: req.timestamp,
				isGroup: req.isGroup
			});
			api.markAsRead(req.threadID, true);
		});
	});
}

function handleCommands(api, message, code) {
	var words = code.split(' ');
	var i;
	for (i = 0; i < words.length; i++) {
		if (latex.handleCommands(api, message, words.slice(i), words.slice(0,i))) return true;
		if (gnuplot.handleCommands(api, message, words.slice(i), words.slice(0,i))) return true;
	}
	return false;
}

function onMassage(api, message) {
	if (process.env.DEBUG && message.senderID != '100002011303211')
		return;

	// Startwith Commands:
	var msg = message.body;
	if (msg.trim().startsWith('\\') ) {
		var code = message.body.split(' ');
		var command = {
			'\\getdefines': defines.getdefines,
			'\\getlatexchars': latex.getlatexchars,
			'\\define': defines.newDefine,
			'\\undefine': defines.undefine,
			'\\undefineall': defines.undefineall,
			'\\pause': pause.pause_thread,
			'\\unpause': pause.unpause_thread,
			'\\help': help
		}[code[0].toLowerCase()];
		if (command) command(api, message, code.slice(1))
		else if (!pauseObj.data[message.threadID] && !handleCommands(api, message, msg))
			api.sendMessage('Unknown command "' + code[0].toLowerCase() + '", try "\\help" for help', message.threadID);
	} else {
		handleCommands(api, message, msg);
	}

	// TODO: handleNewChat()
}

function handleNewChat(threadID) {
	if (KnownThreads.indexOf(threadID) < 0) {
		newThreadMessage = 'Hey, I\'m a fb-messenger bot, desind to compile Mathematical equations writen in latex. If you want to learn more about how it works, try writing "\\quark help" in the chat!'
		api.sendMessage(req.threadID, newThreadMessage);
	}
}

function web_interface(api) {
	express()
		.use(express.static(path.join(__dirname, 'public')))
		.set('views', path.join(__dirname, 'views'))
		.set('view engine', 'ejs')
		.get('/', (req, res) => res.send('Pages is currently under construction'))
		.listen(PORT, () => console.log(`Listening on ${ PORT }`))
}

const request = require('request');
function CeepAlive() {
	request('https://fb-latex-bot.herokuapp.com/', { json: true }, (err, res, body) => {
		if (err) { return console.log(err); }
		console.log(body);
	});
}

var k = process.env.PAUSE;
if (!k || k.toLowerCase() != 'true') {
	main();
}

// fblatexbot@yandex.com
// Cos_micNøt33
