const fs = require('fs');
const path = 'C:\\Users\\hp\\Desktop\\jangu bi\\jangu-bi\\client\\src\\pages\\parishes\\index.jsx';
const content = fs.readFileSync(path, 'utf8');
console.log('Lignes 148-160:');
content.split('\n').slice(145, 162).forEach((l, i) => console.log(i+146, '|', l));