# JANGU BI — Guide de déploiement

## Infrastructure actuelle
- MongoDB: Atlas (déjà en cloud)
- Redis: Upstash (déjà en cloud)
- Backend: Node.js/Express
- Frontend: React/Vite

## Option 1: Render.com (recommandé, gratuit)

1. Créer un compte sur render.com
2. Connecter votre dépôt GitHub
3. Créer un nouveau "Web Service" pour le backend:
   - Root directory: server
   - Build: npm install
   - Start: node server.js
4. Ajouter les variables d'environnement dans Render:
   - NODE_ENV=production
   - MONGODB_URI=<votre URI Atlas>
   - JWT_SECRET=<votre secret>
   - JWT_REFRESH_SECRET=<votre secret>
   - REDIS_URL=<votre URI Upstash>
5. Créer un "Static Site" pour le frontend:
   - Root directory: client
   - Build: npm run build
   - Publish: dist
   - VITE_API_URL=https://<votre-api>.onrender.com/api

## Option 2: VPS (DigitalOcean/Contabo)

1. Installer Node.js 18+ sur le serveur
2. Cloner le repo
3. Backend: npm install && node server.js (avec PM2)
4. Frontend: npm run build → servir avec Nginx
5. Configurer Nginx comme reverse proxy

## Variables d'environnement requises en production

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<secret_fort_64_chars>
JWT_REFRESH_SECRET=<secret_fort_64_chars>
REDIS_URL=rediss://...
CLIENT_URL=https://jangu-bi.sn
```

### Frontend (.env.production)
```
VITE_API_URL=https://api.jangu-bi.sn/api
VITE_SOCKET_URL=https://api.jangu-bi.sn
```

## Commandes

```bash
# Développement
cd server && node server.js
cd client && npm run dev

# Production (build)
cd client && npm run build

# Test build local
cd client && npm run preview
```
