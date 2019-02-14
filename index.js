const login = require("facebook-chat-api");
const express = require('express')
const path = require('path')
const fs = require("fs");
const mathjax = require('./mathjax')
const PORT = process.env.PORT || 5000

const latex_compiler_obj = JSON.parse(fs.readFileSync("res/completions.json"));
const latex_compiler_keys = Object.keys(latex_compiler_obj).sort().reverse();

var log = require("npmlog");
log.pause();

const dbDataObj = require('./src/dropbox_data_obj')

var DEBUG = process.env.DEBUG;

let pause = new dbDataObj("threads/pause.json", DEBUG);
let defines = new dbDataObj("threads/defines.json", DEBUG);
let pdefines = new dbDataObj("pdefines.json", DEBUG);

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
String.prototype.regexIndexOf = function(regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

const details = fs.readFileSync('fblatexbot-appstate.json', 'utf8');
function main() {
	dropbox_pull();
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
	setInterval(dropbox_upload, DEBUG ? 10*1000 : 300*1000) // Every 5 minute
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

function onMassage(api, message) {
	if (process.env.DEBUG && message.senderID != '100002011303211')
		return;

	var msg = message.body;

	if (msg.includes('\\latex')) {
		latex_message(api, message);
	} else if (msg.trim().startsWith('\\') ){
		var code = message.body.split(' ');
		var command = {
			'\\getdefines': getdefines,
			'\\getlatexchars': getlatexchars,
			'\\define': newDefine,
			'\\undefine': undefine,
			'\\undefineall': undefineall,
			'\\pause': pause_thread,
			'\\unpause': unpause_thread,
			'\\help': help
		}[code[0].toLowerCase()];
		if (command) command(api, message, code.slice(1));
		else api.sendMessage('Unknown command "' + code[0].toLowerCase() + '", try "\\help" for help', message.threadID);
	}

	// handleNewChat()
}

function handleDefines(message, msg) {
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
}

function latex_unicode_compiler(code) {
	if (!code) return code;
	latex_compiler_keys.forEach((key) => {
		search = (key.startsWith('^') || key.startsWith('_')) ? key : "\\"+key;
		code = code.replaceAll(search, latex_compiler_obj[key]);
	});
	return code;
}

// Handle LaTeX event:
function latex_message(api, message, code){
	if (pause.data[message.threadID]) return;
	const msg = message.body;
	var body = latex_unicode_compiler(handleDefines( message, msg.substring(0, msg.indexOf('\\latex')) ));
	var code = handleDefines( message, msg.substring(msg.indexOf('\\latex')+'\\latex'.length, msg.length) );
	if (code && code.length > 1){
		mathjax.tex2png(code, (path) => {
				api.sendMessage({
					body: body,
					attachment: fs.createReadStream("out.png")
				}, message.threadID);
		});
	} else {
		api.sendMessage(body, message.threadID);
	}
}

// handle commands:
function getlatexchars(api, message, code) {
	api.sendMessage({
		attachment: fs.createReadStream("res/completions.json")
	}, message.threadID, (err, res) => {
		console.log(err);
	});
}

function getdefines(api, message, code) {
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
}

function pause_thread(api, message, code) {
	pause.data[message.threadID] = true;
	console.log("Quark Bot is PAUSED!");
	api.sendMessage("Quark Bot is PAUSED!\nUse \"\\quark unpause\" to enable it aigain.", message.threadID);
}

function unpause_thread(api, message, code) {
	pause.data[message.threadID] = false;
	console.log("Quark Bot is ENABLED!");
	api.sendMessage("Quark Bot is ENABLED!", message.threadID);
}

function newDefine(api, message, code){
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
}

function undefine(api, message, code){
	if (message.isGroup) {
		delete defines.data[message.threadID][code[0]];
		api.sendMessage("\""+code[0]+"\" is undefined", message.threadID);
	} else {
		delete pdefines.data[message.threadID][code[0]];
		api.sendMessage("global \""+code[0]+"\" is undefined", message.threadID);
	}
}

function undefineall(api, message, code){
	if (message.isGroup) {
		delete defines.data[message.threadID];
		api.sendMessage("All your defenitions are now gone", message.threadID);
	} else {
		delete pdefines.data[message.threadID];
		api.sendMessage("All your global defenitions are now gone", message.threadID);
	}
}

function help(api, message, code) {
	file = "res/help/" + {
					undefined: 'main',
					'latex': "latex",
					'getdefines': "getdefines",
					'define': "define-undefine",
					'undefine': "define-undefine",
					'pause': "pause-unpause",
					'unpause': "pause-unpause",
					'getdefaultdefines': "getdefaultdefines",
	}[code[0]] + ".txt";

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
				api.sendMessage(msg, message.threadID);
			});
		} else {
			console.log(err);
		}
	});

	/*
	var obj = JSON.parse(fs.readFileSync('res/help/help-message.json', 'utf8'));

	var msg;
	if (!code[0]){
		msg = obj['main'];
	} else {
		msg = obj[{
			'latex': "latex",
			'getdefines': "getdefines",
			'define': "define-undefine",
			'undefine': "define-undefine",
			'pause': "pause-unpause",
			'unpause': "pause-unpause",
			'getdefaultdefines': "getdefaultdefines",
		}[code[0]]];
	}

	if (!Array.isArray(msg))
		msg = [msg];

	msg.forEach((m) => {
		if (typeof(m) == 'object' && m['attachment'])
			m['attachment'] = fs.createReadStream(m['attachment']);
		api.sendMessage(m, message.threadID);
	});*/
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

function sendAttachment(self, userID, filepath){
		send = (user) => {
        msg = { attachment: fs.createReadStream(lst[2]) };
        api.sendMessage(msg, user, (err, resp) => {
            callback(err);
        });
    }
    if(typeof(userID) === "number"){
        send(userID)
    }else if (typeof(userID) === "string") {
        api.getUserID(userID, (err, users) =>
            send(users[0].userID)
        );
    }
    break;

}

function sendMessage(api, user, message) {
		if(typeof(user) === "number"){
		    api.sendMessage(message, user);
        return "Sendt";
    }else if (typeof(user) === "string") {
		    api.getUserID(user, (err, users) => {
            api.sendMessage(message, users[0].userID);
		    });
		    return "Sendt";
    }
    return "not sendt"
}

function dropbox_pull() {
	pause.db_pull();
	defines.db_pull();
	pdefines.db_pull();
}

function dropbox_upload() {
	console.log("Uploading to dropbox!");
	pause.db_push();
	defines.db_push();
	pdefines.db_push();
}

function dropbox_get_file(file, callback) {
	dfs.readFile(file, {encoding: 'utf8'}, (err, result) => {
		if (err){ callback(err); } else {
			callback(null, JSON.parse(result));
		}
	});
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

/*
{ threadID: '100033071253163',
  name: 'Noko Rot',
  unreadCount: 1,
  messageCount: 3,
  imageSrc: null,
  emoji: null,
  color: null,
  nicknames: [],
  muteUntil: null,
  participants:
   [ { accountType: 'User',
       userID: '100033071253163',
       name: 'Noko Rot',
       shortName: 'Noko',
       gender: 'FEMALE',
       url: 'https://www.facebook.com/noko.rot.18',
       profilePicture:
        'https://scontent-lht6-1.xx.fbcdn.net/v/t1.0-1/p50x50/50500515_100923384353370_353684191684067328_n.jpg?_nc_cat=109&_nc_ht=scontent-lht6-1.xx&oh=81acd2be0f71469fd8f2418b0831dafc&oe=5CD05A89',
       username: 'noko.rot.18',
       isViewerFriend: false,
       isMessengerUser: false,
       isVerified: false,
       isMessageBlockedByViewer: false,
       isViewerCoworker: false,
       isEmployee: null },
     { accountType: 'User',
       userID: '100032565408581',
       name: 'Quark Bott',
       shortName: 'Quark',
       gender: 'FEMALE',
       url: 'https://www.facebook.com/noko.rot.946',
       profilePicture:
        'https://scontent-lht6-1.xx.fbcdn.net/v/t1.0-1/c96.151.768.768a/s50x50/49831285_105356210559892_8593331090792382464_n.jpg?_nc_cat=107&_nc_ht=scontent-lht6-1.xx&oh=1b91e2b46afdbb629e254b6a600f1a2d&oe=5CC9579D',
       username: 'noko.rot.946',
       isViewerFriend: false,
       isMessengerUser: false,
       isVerified: false,
       isMessageBlockedByViewer: false,
       isViewerCoworker: false,
       isEmployee: null } ],
  adminIDs: [],
  folder: 'PENDING',
  isGroup: false,
  customizationEnabled: true,
  participantAddMode: null,
  montageThread: null,
  reactionsMuteMode: 'REACTIONS_NOT_MUTED',
  mentionsMuteMode: 'MENTIONS_NOT_MUTED',
  isArchived: false,
  isSubscribed: true,
  timestamp: '1547667517900',
  snippet: 'Hey',
  snippetAttachments: null,
  snippetSender: '100033071253163',
  lastMessageTimestamp: '1547667517900',
  lastReadTimestamp: null,
  cannotReplyReason: null,
  participantIDs: [ '100033071253163', '100032565408581' ],
  threadType: 1 }
*/
