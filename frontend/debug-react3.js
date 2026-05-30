const fs = require('fs');
const babel = require('@babel/core');
const code = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx', 'utf-8');
const result = babel.transformSync(code, {
  presets: ['@babel/preset-react']
});
console.log(result.code.substring(result.code.length - 500));
