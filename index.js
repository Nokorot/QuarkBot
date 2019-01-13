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
		console.log("Starting to listen for messages");
		api.listen((err, message) => onMassage(api, message));
	});
	setTimeout(CeepAlive, 60*1000);
}

function onMassage(api, message) {
	var key = '\\latex'

	var msg = message.body;
	if (msg.trim().startsWith(key)){
		var msg = message.body.replace(key, '');
		if (msg.trim().toLowerCase() == 'pause') {
			pause[message.threadID] = true;
			api.sendMessage("Latex comelation is PAUSED!");
		}
    else if (msg.trim().toLowerCase() == 'unpause') {
			pause[message.threadID] = false;
			api.sendMessage("Latex comelation is ENABLED!");
		}
	} else if (msg.includes(key)) {
		var body = msg.substring(0, msg.indexOf(key));
    var code = msg.substring(msg.indexOf(key)+key.length, msg.length);
		mathjax.tex2png(code, (path) => {
 				api.sendMessage({
 					body: body,
 					attachment: fs.createReadStream("out.png")
 				}, message.threadID);
 		});
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
	setTimeout(CeepAlive, 60*1000); // 10 minutes
}

if (process.env.PAUSE != 'True') {
	main();
}

// fblatexbot@yandex.com
// Cos_micNøt33
