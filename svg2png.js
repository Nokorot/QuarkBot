const { convertFile}  = require('convert-svg-to-png');

(async() => {
  const inputFilePath = 'res.svg';
  const outputFilePath = await convertFile(inputFilePath, options={width:1000, scale=0.5});

  console.log(outputFilePath);
  //=> "/path/to/my-image.png"
})();
