//node modules
const parse = require('csv-parse');

var parser = parse({delimiter: '\t', skip_empty_lines: true, relax: true}); // we need relax to deal with the line error problem

parser.on('error', function(err){
    console.log('error in parser: ' + err)
})

parser.on('finish', function(){
    console.log('parser finished')
})

module.exports = parser