#!/bin/bash
# Remise à zéro de la démo, lancée chaque nuit par une tâche planifiée Alwaysdata :
# 1. supprime les images envoyées par les visiteurs (celles qui ne sont pas dans le script SQL de démo)
# 2. recharge les 11 projets d'origine dans la base

# Arrête le script à la première erreur
set -e

cd "$HOME/api"

# Liste des images de la démo, extraite du script SQL (un nom de fichier par ligne)
LISTE=$(mktemp)
grep -o "images/[^']*" donnees-demo-prod.sql | sed 's#images/##' > "$LISTE"

# 1. Supprime toute image qui n'est pas dans la liste
for f in images/*; do
  nom=$(basename "$f")
  if ! grep -qxF "$nom" "$LISTE"; then
    rm -f "$f"
    echo "supprimé : $nom"
  fi
done
rm -f "$LISTE"

# 2. Recharge les projets de démo (avec le module sqlite3 déjà installé pour le backend)
node -e "
const sqlite3 = require('sqlite3')
const db = new sqlite3.Database('database.sqlite')
db.exec(require('fs').readFileSync('donnees-demo-prod.sql', 'utf8'), (error) => {
  if (error) { console.error(error); process.exitCode = 1 }
  db.close()
})
"

echo "$(date '+%Y-%m-%d %H:%M') : démo remise à zéro"
