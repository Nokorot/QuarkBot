
const dfs = require('dropbox-fs')({
    apiKey: process.env.DROPBOX_API_KEY
});

module.exports = class dropboxDataObj {
	constructor(db_file, debug=false) {
		this.db_file = debug ? "/debug/" + db_file :  "/" + db_file;
		this.dont_overide = true;
		this._data = {};
	}

	get data() {
		return this._data;
	}

	db_pull() {
		dfs.readFile(this.db_file, {encoding: 'utf8'}, (err, result) => {
			if (err && err.status != 409) return;
			if (!err) {
				const obj = JSON.parse(result);
				// TODO : Log or timestamp the changes to beter combine the separat data.
				Object.keys(this._data).forEach((key) => { obj[key] = this._data[key]; });
				this._data = obj;
			}
			this.dont_overide = false;
		});
	}

	db_push() {
		if (!this.dont_oweride)
			dfs.writeFile(this.db_file, JSON.stringify(this.data), (err, stat) => {
				if (err) console.log(err);
			});
	}
};
