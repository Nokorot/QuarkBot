// a simple TeX-input example
var mjAPI = require("mathjax-node-svg2png");
var fs = require('fs');
var PNG = require('pngjs').PNG;

function clamp(x, min, max){
    return x < min ? min : x > max ? max : x;
}

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

                    var corner = false;

                    if (y < r && x < r && x+y < r && (x-r)**2+(y-r)**2 > r**2){
                        corner = true; xx=x, yy=y
                    } else if (h-1-y < r && x < r && (x-r)**2+(h-1-y-r)**2 > r**2){
                        corner = true; xx=x, yy=h-1-y
                    } else if (y < r && w-1-x < r && (w-1-x-r)**2+(y-r)**2 > r**2){
                        corner = true; xx=w-1-x, yy=y;
                    } else if (h-1-y < r && w-1-x < r && (w-1-x-r)**2+(h-1-y-r)**2 > r**2) {
                        corner = true; xx=w-1-x, yy=h-1-y;
                    }

                    if (corner){
                        for(var i = 0; i<3; i++){
                            this.data[idx+i] = 255;
                        }
                        var op = 1;
                        if ((xx+1-r)**2+(yy-r)**2 > r**2) op++;
                        if ((xx-r)**2+(yy+1-r)**2 > r**2) op++;
                        if ((xx+1-r)**2+(yy+1-r)**2 > r**2) op++;

                        this.data[idx+3] = (4-op)*255/4;
                    } else {
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
