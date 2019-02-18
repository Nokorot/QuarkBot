

const appstateFile = 'fblatexbot-appstate.json';
var credentials = {email: process.env.FB_EMAIL, password: process.env.FB_PASSWORD};

module.exports = function (callback) {
    var fs = require('fs');
    const login = require("facebook-chat-api");
    if (fs.existsSync(appstateFile)) {
        const details = fs.readFileSync(appstateFile, 'utf8');
        login({appState: JSON.parse(details)},  callback)
    } else {
        login(credentials, (err, api) => {
            if(err) callback(err);
            fs.writeFileSync(appstateFile, JSON.stringify(api.getAppState()));
            callback(err, api);
        });
    }
}
