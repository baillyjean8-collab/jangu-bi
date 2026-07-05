#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# JANGU BI — Script de démarrage local
# Lance le backend + frontend en mode développement
#
# Usage:
#   chmod +x start-dev.sh
#   ./start-dev.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          🕊️  JANGU BI Dev Setup         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# ── Vérification Node.js ──────────────────────────────────────
NODE_VERSION=$(node -v 2>/dev/null | cut -d. -f1 | tr -d 'v' || echo "0")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ requis. Version actuelle: $(node -v 2>/dev/null || echo 'non installé')${NC}"
  echo "   Installez Node.js 20: https://nodejs.org"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# ── .env backend ──────────────────────────────────────────────
if [ ! -f "server/.env" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  Fichier server/.env manquant${NC}"
  echo "   Création depuis .env.example…"
  cp server/.env.example server/.env

  # Générer des secrets automatiquement pour le dev
  ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  OTP_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

  # Remplacer les placeholders
  sed -i.bak "s|FILL_IN_64_CHAR_RANDOM_HEX_STRING_FOR_ACCESS_TOKEN|${ACCESS_SECRET}|g" server/.env
  sed -i.bak "s|FILL_IN_DIFFERENT_64_CHAR_RANDOM_HEX_STRING_FOR_REFRESH|${REFRESH_SECRET}|g" server/.env
  sed -i.bak "s|FILL_IN_64_CHAR_RANDOM_HEX_STRING_FOR_OTP_HASHING|${OTP_SECRET}|g" server/.env
  rm -f server/.env.bak

  echo ""
  echo -e "${YELLOW}📝 IMPORTANT: Éditez server/.env et remplissez MONGODB_URI${NC}"
  echo "   Exemple MongoDB Atlas gratuit: https://cloud.mongodb.com"
  echo ""
  echo "   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jangubi"
  echo ""
  read -p "   Appuyez sur Entrée après avoir configuré MONGODB_URI… "
fi

# Vérifier MONGODB_URI
MONGO_URI=$(grep "^MONGODB_URI=" server/.env | cut -d= -f2-)
if [ -z "$MONGO_URI" ] || [[ "$MONGO_URI" == *"USERNAME:PASSWORD"* ]]; then
  echo -e "${RED}❌ MONGODB_URI non configuré dans server/.env${NC}"
  exit 1
fi
echo -e "${GREEN}✅ MONGODB_URI configuré${NC}"

# ── Installation dépendances ──────────────────────────────────
echo ""
echo -e "${BLUE}📦 Installation des dépendances…${NC}"

if [ ! -d "server/node_modules" ]; then
  echo "  → Backend (npm install)…"
  (cd server && npm install --silent)
  echo -e "  ${GREEN}✅ Backend installé${NC}"
else
  echo -e "  ${GREEN}✅ Backend (déjà installé)${NC}"
fi

if [ ! -d "client/node_modules" ]; then
  echo "  → Frontend (npm install)…"
  (cd client && npm install --silent)
  echo -e "  ${GREEN}✅ Frontend installé${NC}"
else
  echo -e "  ${GREEN}✅ Frontend (déjà installé)${NC}"
fi

# ── Lancement ─────────────────────────────────────────────────
echo ""
echo -e "${BLUE}🚀 Lancement de l'application…${NC}"
echo ""
echo -e "  Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "  Health:   ${GREEN}http://localhost:5000/health${NC}"
echo ""
echo -e "${YELLOW}  Ctrl+C pour arrêter${NC}"
echo ""

# Lancer backend et frontend en parallèle
# Utiliser trap pour nettoyer proprement
cleanup() {
  echo ""
  echo -e "${YELLOW}Arrêt des serveurs…${NC}"
  kill 0
}
trap cleanup SIGINT SIGTERM

# Backend
(cd server && npm run dev 2>&1 | sed 's/^/  [API] /') &
BACKEND_PID=$!

# Attendre que le backend soit prêt
sleep 3

# Frontend
(cd client && npm run dev 2>&1 | sed 's/^/  [UI]  /') &
FRONTEND_PID=$!

# Attendre les deux processus
wait $BACKEND_PID $FRONTEND_PID
