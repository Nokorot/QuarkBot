// a simple TeX-input example
var mjAPI = require("mathjax-node-svg2png");
var fs = require('fs');
var PNG = require('pngjs').PNG;

function addBackground(imgpath, callback) {
    fs.createReadStream(imgpath)
        .pipe(new PNG({
            filterType: 4
        }))
        .on('parsed', function() {
            r = 10, h=this.height, w=this.width;
            for (var y = 0; y < this.height; y++) {
                for (var x = 0; x < this.width; x++) {
                    var idx = (this.width * y + x) << 2;

                    if (y < r && x < r && (x-r)**2+(y-r)**2 > r**2)
                        this.data[idx+3] = 0;
                    else if (h-y < r && x < r && (x-r)**2+(h-y-r)**2 > r**2)
                        this.data[idx+3] = 0;
                    else if (y < r && w-x < r && (w-x-r)**2+(y-r)**2 > r**2)
                        this.data[idx+3] = 0;
                    else if (h-y < r && w-x < r && (w-x-r)**2+(h-y-r)**2 > r**2)
                        this.data[idx+3] = 0;
                    else {
                        for(var i = 0; i<3; i++){
                            this.data[idx+i] = this.data[idx+i]*this.data[idx+3]
                                           + 1*(255-this.data[idx+3]);
                        }
                        this.data[idx+3] = 255;
                    }

                }
            }

            this.pack()
                .pipe(fs.createWriteStream(imgpath))
                .on('finish', function () {
                    console.log('Hey');
                    callback();
                });
        });
}

(function() {
  module.exports.tex2png = function(yourMath, callback) {
    console.log(yourMath);
    mjAPI.typeset({
      math: yourMath,
      format: "TeX", // or "inline-TeX", "MathML"
      png:true,      // or svg:true, or html:true
      scale:10
    }, function (data) {
        var base64Data = data.png.replace(/^data:image\/png;base64,/, "");
        fs.writeFile("out.png", base64Data, 'base64', function(err) {
          if (err) {console.log(err);}
          addBackground('out.png', callback);
        });
    });
  }
}());
