// a simple TeX-input example
var mjAPI = require("mathjax-node-svg2png");
var fs = require('fs');

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
          callback('out.png');
        });
    });
  }
}());
