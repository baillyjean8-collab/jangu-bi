const fs = require('fs');
const path = 'C:\\Users\\hp\\Desktop\\jangu bi\\jangu-bi\\client\\src\\pages\\parishes\\index.jsx';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
// Afficher ligne 144-146
console.log('Ligne 144:', lines[143]);
console.log('Ligne 145:', lines[144]);
console.log('Ligne 146:', lines[145]);