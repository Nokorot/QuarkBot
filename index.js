const login = require("facebook-chat-api");
const fs = require("fs");
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const details = fs.readFileSync('appstate.json', 'utf8');
login({appState: JSON.parse(details)}, (err, api) => {
	express()
	  .use(express.static(path.join(__dirname, 'public')))
	  .set('views', path.join(__dirname, 'views'))
	  .set('view engine', 'ejs')
	  .get('/', (req, res) => res.send('pages/index'))
	  .get('/send', (req, res) => {
	  		res.send(sendMessage(api, "tor-haakon", "Hey it works!"));
	  	})	 
	  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
});

function sendMessage(api, user, message) {
	console.log("Request message sendt!")
    if(typeof(user) === "number"){
		console.log("AAA")
        api.sendMessage(message, user);
        return "Sendt";
    }else if (typeof(user) === "string") {
		console.log("BBB")
        api.getUserID(user, (err, users) => {
            api.sendMessage(message, users[0].userID);            
			console.log("DDD")
        });
		console.log("CCC")
        return "Sendt";
    }
    console.log("EEE")
    return "not sendt"
}