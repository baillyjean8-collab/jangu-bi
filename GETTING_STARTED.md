# 🕊️ JANGU BI — Guide de démarrage rapide

## Prérequis

| Outil | Version | Installation |
|-------|---------|-------------|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | inclus avec Node |
| MongoDB | Atlas (cloud) | https://cloud.mongodb.com |
| Git | n'importe | https://git-scm.com |

---

## ⚡ Démarrage en 5 étapes

### Étape 1 — Cloner le projet

```bash
git clone <url-du-repo> jangu-bi
cd jangu-bi
```

### Étape 2 — Configurer le backend

```bash
cd server
cp .env.example .env
```

Ouvrez `server/.env` et remplissez **uniquement ces 3 champs** pour commencer :

```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/jangubi
JWT_ACCESS_SECRET=<générer avec la commande ci-dessous>
JWT_REFRESH_SECRET=<générer avec une commande différente>
OTP_HMAC_SECRET=<générer avec une commande différente>
```

**Générer les secrets** (lancez 3 fois, copiez 3 valeurs différentes) :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Étape 3 — Installer les dépendances

```bash
# Depuis la racine du projet
npm install          # installe concurrently
cd server && npm install
cd ../client && npm install
```

### Étape 4 — Seeder la base de données

```bash
cd server
npm run seed
```

Cela crée automatiquement :
- 👤 Super Admin : `admin@jangubi.com` / `Admin@2024!`
- 👤 Admin Paroisse : `pierre@jangubi.com` / `Admin@2024!`
- 👤 Utilisateur : `marie@jangubi.com` / `User@2024!`
- ⛪ 3 paroisses de démonstration
- 💛 4 dons de démonstration

### Étape 5 — Lancer l'application

```bash
# Depuis la racine du projet
npm run dev
```

**Ou séparément :**

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

**Accès :**
- 🌐 Application : http://localhost:5173
- 🔌 API : http://localhost:5000
- ❤️ Health : http://localhost:5000/health

---

## 🗺️ Navigation dans l'application

### En tant qu'utilisateur normal (`marie@jangubi.com`)

| Page | URL | Ce qu'on peut faire |
|------|-----|---------------------|
| Accueil | `/` | Voir les services en direct, découvrir les paroisses |
| Paroisses | `/parishes` | Chercher, filtrer, rejoindre une paroisse |
| Détail paroisse | `/parishes/:id` | Stats, description, bouton "Rejoindre" |
| Live | `/live` | Voir tous les services en direct |
| Viewer | `/live/:id` | Regarder + envoyer des réactions anonymes |
| Don | `/donate` | Flux 3 étapes : montant → provider → confirmation |
| Profil | `/profile` | Modifier profil, changer mot de passe, historique dons |

### En tant qu'admin paroisse (`pierre@jangubi.com`)

| Page | URL | Ce qu'on peut faire |
|------|-----|---------------------|
| Tableau de bord | `/my-parish` | Stats de la paroisse |
| Gérer le live | `/my-parish` → onglet "Live" | Lancer/arrêter un service |
| Infos paroisse | `/my-parish` → onglet "Infos" | Modifier nom, description |
| Donations | `/my-parish` | Voir les dons reçus |

### En tant que super admin (`admin@jangubi.com`)

| Page | URL | Ce qu'on peut faire |
|------|-----|---------------------|
| Dashboard | `/admin` | Stats globales |
| Utilisateurs | `/admin` → "Utilisateurs" | Gérer rôles, désactiver |
| Dons | `/admin` → "Dons" | Filtrer, consulter tous les dons |
| Audit | `/admin` → "Audit" | Journal immuable de toutes les actions |
| Admin panel | `/admin` → paroisses | Vérifier les paroisses |

---

## 🔧 Commandes utiles

```bash
# Backend
cd server
npm run dev          # démarrage développement (nodemon)
npm run seed         # créer les données de test
npm run seed:reset   # effacer et recréer les données
npm test             # tests d'intégration API
npm run lint         # vérification ESLint

# Frontend
cd client
npm run dev          # démarrage Vite
npm run build        # build production → dist/
npm run preview      # prévisualiser le build

# Projet complet (depuis la racine)
npm run dev          # lance API + UI simultanément
npm run build        # build le frontend
```

---

## 🌐 Variables d'environnement — Description complète

### Obligatoires

| Variable | Description | Exemple |
|----------|-------------|---------|
| `MONGODB_URI` | URL MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/jangubi` |
| `JWT_ACCESS_SECRET` | Clé signature access token (64+ chars) | `<hex aléatoire>` |
| `JWT_REFRESH_SECRET` | Clé signature refresh token (**différente**) | `<hex aléatoire>` |
| `OTP_HMAC_SECRET` | Clé HMAC pour hachage OTP (64+ chars) | `<hex aléatoire>` |
| `CLIENT_URL` | URL du frontend (CORS) | `http://localhost:5173` |

### Optionnelles (avec valeurs par défaut)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | `5000` | Port du serveur |
| `NODE_ENV` | `development` | Environnement |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Durée access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Durée refresh token |
| `SERVER_URL` | `http://localhost:5000` | URL publique du serveur (webhooks) |

### Paiement (requis en production)

| Variable | Description |
|----------|-------------|
| `CINETPAY_API_KEY` | Clé API CinetPay |
| `WAVE_SECRET_KEY` | Secret webhook Wave |
| `ORANGE_MONEY_SECRET` | Secret webhook Orange Money |
| `MTN_MOMO_SECRET` | Secret webhook MTN MoMo |

---

## 🐛 Résolution de problèmes courants

### "FATAL: Missing required environment variables"
→ Vérifiez que `server/.env` existe et que `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `OTP_HMAC_SECRET` sont remplis.

### "MongoServerError: bad auth"
→ Vérifiez vos identifiants MongoDB Atlas. Assurez-vous que votre IP est dans la liste blanche (Network Access → Add IP Address → Allow from anywhere pour le dev).

### "CORS error" dans le navigateur
→ Vérifiez que `CLIENT_URL=http://localhost:5173` dans `server/.env` correspond à l'URL du frontend.

### Le frontend ne reçoit pas le cookie de refresh
→ Vérifiez que `withCredentials: true` est dans la config Axios. En dev, Vite proxy `/api` vers le backend.

### L'OTP n'arrive pas
→ En développement, l'OTP est masqué dans les logs console du backend (`[OTP-DEV] OTP issued: ****XX`). Regardez les logs du terminal.

---

## 📁 Structure du projet

```
jangu-bi/
├── client/                    # Frontend React + Vite
│   └── src/
│       ├── api/               # Axios + intercepteurs
│       ├── context/           # AuthContext
│       ├── guards/            # ProtectedRoute, RoleGuard
│       ├── hooks/             # useSocket
│       ├── components/        # UI + Layout
│       └── pages/             # 9 pages complètes
│
├── server/                    # Backend Express
│   ├── scripts/
│   │   └── seed.js            # ← Données de test
│   └── src/
│       ├── config/            # env, database
│       ├── domains/           # auth, users, parishes, live, donations, admin
│       ├── middlewares/       # authenticate, authorize, security...
│       ├── models/            # 7 schémas Mongoose sécurisés
│       ├── realtime/          # Socket.io
│       └── shared/            # errors, payment, utils
│
├── deployment/                # Nginx, PM2, scripts deploy
├── .github/workflows/         # CI/CD GitHub Actions
├── start-dev.sh               # Script démarrage automatique
└── README.md
```

---

## 🔒 Architecture de sécurité (résumé)

- **JWT** : Access token 15min en mémoire JS, Refresh token 7j en cookie httpOnly
- **OTP** : Hashé HMAC-SHA256 (jamais en clair), TTL 10min, max 3 essais
- **Mots de passe** : bcrypt cost=12, complexité enforced
- **RBAC** : 3 rôles (user/parish_admin/super_admin), vérifiés à chaque requête
- **Rate limiting** : 4 niveaux (auth/OTP/donations/général)
- **Paiements** : Vérification HMAC par provider, état machine stricte, idempotence
- **Audit** : Log immuable de toutes les actions financières et admin (35 types)
- **Socket.io** : Réactions 100% anonymes, rate-limit par socket, réconciliation viewers

---

*JANGU BI — Connecter les paroisses et les fidèles d'Afrique 🕊️*
