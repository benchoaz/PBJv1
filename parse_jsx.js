const fs = require('fs');
const babel = require('@babel/core');

try {
  babel.transformFileSync('./frontend/src/components/ProcurementPreparation.jsx', {
    presets: ['@babel/preset-react']
  });
  console.log('JSX parsed successfully!');
} catch (err) {
  console.log('PARSE ERROR:', err.message);
}
