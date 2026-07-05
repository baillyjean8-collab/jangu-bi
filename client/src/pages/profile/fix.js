const fs=require('fs');  
let c=fs.readFileSync('C:/Users/hp/Desktop/jangu bi/jangu-bi/client/src/pages/profile/index.jsx','utf8');  
c=c.replace("import { useState } from \"react\";","import { useState } from \"react\";\nimport AppShell from \"../../components/AppShell\";");  
c=c.replace("return (\n    <div","return (\n    <AppShell><div");  
c=c.replace("    </div>\n  );\n}","    </div></AppShell>\n  );\n}");  
fs.writeFileSync('C:/Users/hp/Desktop/jangu bi/jangu-bi/client/src/pages/profile/index.jsx',c,'utf8');  
console.log('OK');  
