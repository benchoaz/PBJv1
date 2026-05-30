const fs = require('fs');
const babel = require('@babel/core');
try {
  babel.transformSync(fs.readFileSync('/home/beni/PBJ/frontend/src/components/ProcurementPreparation.jsx', 'utf-8'), {
    presets: ['@babel/preset-react']
  });
  console.log('ProcurementPreparation: No syntax errors!');
} catch (e) {
  console.error(e.message);
}
