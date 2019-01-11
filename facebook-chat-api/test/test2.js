const fs = require("fs");
const login = require("facebook-chat-api");

const shell = require("shelljs")

// Simple echo bot. It will repeat everything that you say.
// Will stop when you say '/stop'
/*login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
    if(err) return console.error(err);
    console.log("Hey");
});*/
