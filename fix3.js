const fs = require('fs');
const path = 'C:\\Users\\hp\\Desktop\\jangu bi\\jangu-bi\\client\\src\\pages\\parishes\\index.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Remplacer la ligne 145 (index 144) par 
lines[144] = '          <a';

content = lines.join('\n');
fs.writeFileSync(path, content, 'utf8');
console.log('Correction appliquée !');