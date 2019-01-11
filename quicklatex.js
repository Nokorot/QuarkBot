var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var http = require('http');
var request = require('request');

PNG_FORMAT = 1;
SVG_FORMAT = 2;

function Post(post_data) {
  var post_options = {
      host: 'http://www.quicklatex.com/latex3.f',
      method: 'POST'
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });

  post_req.write(post_data);
  post_req.end();

}

( function() {
	module.exports.qlatex_compile = function(latex_code, config){
		body  = 'formula=' + quicklatex_encode(latex_code);
	    body += '&fsize='  + (config['size'] ? str(config['size'])+'px' : '17px');
	    body += '&fcolor=' + (config['color'] ? str(config['color']) : 'FFFFFF');
	    body += '&out='    + (config['imageformat'] ? str(config['imageformat']) : '1');
	    //body += '&mode='   + mode;
	    //body += '&remhost=' + quicklatex_encode(get_option('siteurl').' '.get_permalink());

		//if(preamble!='')
		//	body += '&preamble=' + quicklatex_encode(preamble);
		if(config['background'] && config['background'] != 'transparent')
			body += '&bcolor=' + config['background'];


		const url = 'http://www.quicklatex.com/latex3.f';

		request({
			url: 'http://www.quicklatex.com/latex3.f',
			type: 'POST',
			dataType: 'text/plain',
			data: body
		}, function (error, response, data) {
				console.log(error)
				console.log(response.statusCode)
				console.log(response.body)
		        if (!error && response.statusCode == 200) {
		            console.log(data)
		        }
		  }
		);
		/*
		//// Send request to compile LaTeX code on the server
		var request = new XMLHttpRequest();
	    request.onreadystatechange = function() {
	        if (this.readyState == 4 && this.status == 200){
	            console.log(this.responseText);
			}
	    }
	    request.open("POST", url, true);
	    request.send(body);
		console.log('Hey');*/

		/*
	    r = requests.post(url, data=str(body))

	    if r.text[0] != "0":
	        print("QuickLaTeX Error:")
	        print("\t" + repr(r.text));
	        return None;
	    try {
	        url,_,width,height = r.text[3:].split(' ')
	        return url, int(width), int(height);
	    } catch (err){
	        return None;
	    }*/
	}
}());

/*function download_pic(url, output){
    handle = open(output, 'wb')
    response = requests.get(url, stream=True)

    if not response.ok:
        print(response)

    for block in response.iter_content():
        if not block:
            break
        handle.write(block)
    handle.close()
}*/

function str_replace(keys, vals, str){
    var re = new RegExp(keys.join("|"),"gi");
    return str.replace(re, function(matched){
		return vals[keys.indexOf(matched)];
    });
};

// Simplified encoding of LaTeX code pieces
// for transmission to server
function quicklatex_encode(string) {
	return str_replace( [  '%',  '&'], ['%25','%26'], string );
}
