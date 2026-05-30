const fs = require('fs');
const babel = require('@babel/core');
try {
  babel.transformSync(fs.readFileSync('/home/beni/PBJ/frontend/src/components/TemplateSuratManager.jsx', 'utf-8'), {
    presets: ['@babel/preset-react']
  });
  console.log('No syntax errors!');
} catch (e) {
  console.error(e.message);
}
