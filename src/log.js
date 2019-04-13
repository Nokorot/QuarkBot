
const fs = require('fs')

module.exports = function (  ) {
  const dir = '.'
  var access = fs.createWriteStream(dir + '/node.access.log', { flags: 'a' })
  var error  = fs.createWriteStream(dir + '/node.error.log', { flags: 'a' });


  // redirect stdout / stderr
  process.stdout.pipe(access);
  process.stderr.pipe(error);

  return function(message, level=0) {
    if (level > 0)
      error.write(message + "\n");
    else
      access.write(message + "\n");
  };
}
