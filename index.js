const login = require("facebook-chat-api");
const express = require('express')
const path = require('path')
const fs = require("fs");
const mathjax = require('./mathjax')
const PORT = process.env.PORT || 5000

const pause = {};

const details = fs.readFileSync('fblatexbot-appstate.json', 'utf8');
function main() {
	web_interface()

	login({appState: JSON.parse(details)}, (err, api) => {
		setInterval(() => {handleMessageRequests(api)}, 2*1000); // Every .5 minute

		api.setOptions({listenEvents: true})
		console.log("Starting to listen for messages");
		api.listen((err, event) => {
			if (err) return;
			console.log(event);
			if (event['type'] == 'message' && event.senderID == '100002011303211')
				onMassage(api, event);
		});
	});
	setInterval(CeepAlive, 600*1000);  // Every 10 minutes
}

function handleMessageRequests(api) {
	api.getThreadList(100, null, ['PENDING'], (err, list) => {
		list.forEach((req)=>{
			console.log(req.threadID);
			api.handleMessageRequest(req.threadID, true);
			api.markAsRead(req.threadID, true);
		});
	});
}

function onMassage(api, message) {
	console.log(message.body);
	var key = '\\latex'

	var msg = message.body;
	if (msg.trim().startsWith(key)){
		var code = message.body.replace(key, '');
		if (code.trim().toLowerCase() == 'pause') {
			pause[message.threadID] = true;
			console.log("Latex comelation is PAUSED!");
			api.sendMessage("Latex comelation is PAUSED!");
		}
    else if (code.trim().toLowerCase() == 'unpause') {
			pause[message.threadID] = false;
			console.log("Latex comelation is ENABLED!");
			api.sendMessage("Latex comelation is ENABLED!");
		}
	}
	if (msg.includes(key)) {
		var body = msg.substring(0, msg.indexOf(key));
    var code = msg.substring(msg.indexOf(key)+key.length, msg.length);
		if (!pause[message.threadID]) {
			console.log(code);
			mathjax.tex2png(code, (path) => {
	 				api.sendMessage({
	 					body: body,
	 					attachment: fs.createReadStream("out.png")
	 				}, message.threadID);
	 		});
		}
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

const request = require('request');
function CeepAlive() {
	request('https://fb-latex-bot.herokuapp.com/', { json: true }, (err, res, body) => {
		if (err) { return console.log(err); }
		console.log(body);
	});
}

if (process.env.PAUSE != 'True') {
	main();
}

// fblatexbot@yandex.com
// Cos_micNøt33
