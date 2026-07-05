const fs=require('fs');
const f='C:\\\\Users\\\\hp\\\\Desktop\\\\jangu bi\\\\jangu-bi\\\\server\\\\src\\\\realtime\\\\index.js';
let c=fs.readFileSync(f,'utf8');

const oldRequire="const { Server } = require('socket.io');";
const newRequire=oldRequire+'\\n  const { createAdapter } = require(\\'@socket.io/redis-adapter\\');\\n  const { getRedisClient } = require(\\'../config/redis\\');';
c=c.replace(oldRequire,newRequire);

const oldUse='io.use(socketAuthMiddleware);';
const newUse='const redisClient = getRedisClient();\\n  if (redisClient) {\\n    const pubClient = redisClient.duplicate();\\n    const subClient = redisClient.duplicate();\\n    io.adapter(createAdapter(pubClient, subClient));\\n    console.log(\\'Redis adapter active\\');\\n  }\\n\\n  io.use(socketAuthMiddleware);';
c=c.replace(oldUse,newUse);

fs.writeFileSync(f,c,'utf8');
console.log('patch applied');
