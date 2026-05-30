const fs = require('fs');
const babel = require('@babel/core');
const code = fs.readFileSync('/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx', 'utf-8');
try {
  babel.transformSync(code, {
    presets: ['@babel/preset-react']
  });
  console.log('Babel transform OK');
} catch (e) {
  console.error(e);
}
