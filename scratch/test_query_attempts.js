const fs = require('fs');
const code = fs.readFileSync('/home/beni/PBJ/survey-service/server.js', 'utf8');
const { NodeVM } = require('vm2');

// We don't have vm2 installed easily to mock everything, so let's just run node directly 
