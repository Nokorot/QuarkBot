const login = require("facebook-chat-api");
const express = require('express')
const path = require('path')
const fs = require("fs");
const mathjax = require('./mathjax')
const PORT = process.env.PORT || 5000

var log = require("npmlog");


const details = fs.readFileSync('fblatexbot-appstate.json', 'utf8');
login({appState: JSON.parse(details)}, (err, api) => {
	web_interface()

	console.log("Starting to listen for messages");
	//log.pause();
	api.listen((err, message) => {
		if (process.env.PAUSE == 'True')
			return;
		if (message.body.trim().startsWith('\\latex')){
			mathjax.tex2png(message.body.replace('\\latex', ''), (path) => {
				api.sendMessage({
					// body: message.body,
					attachment: fs.createReadStream("out.png")
				}, message.threadID);
			});
		}
	});
});

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
	console.log('Hey')


	request('https://fb-latex-bot.herokuapp.com/', { json: true }, (err, res, body) => {
		if (err) { return console.log(err); }
		console.log(body);
	});

	setTimeout(CeepAlive, 60*1000); // 10 minutes
}
setTimeout(CeepAlive, 60*1000);

// fblatexbot@yandex.com
// Cos_micNøt33
