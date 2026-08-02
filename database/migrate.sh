#!/bin/bash
# ============================================================
# Script de migração do banco crm-base (Supabase local)
# Uso: ./migrate.sh          # aplica todas as migrações pendentes
#      ./migrate.sh 002      # aplica uma migração específica
# ============================================================
set -e

DB_CONTAINER="supabase-db"
DB_NAME="supabase"   # banco principal do Supabase self-hosted (tem auth)
MIGRATIONS_DIR="$(dirname "$0")/migrations"

# Rastrear migrações aplicadas
mkdir -p "$(dirname "$0")/.applied"

echo "🔧 Aplicando migrações no banco '$DB_NAME'..."

# Se pediu migração específica
if [ -n "$1" ]; then
  FILE="${MIGRATIONS_DIR}/${1}*.sql"
  for f in $FILE; do
    [ -f "$f" ] || { echo "❌ Migração '$1' não encontrada"; exit 1; }
    echo "  → Aplicando $(basename "$f")..."
    docker exec -i "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" < "$f"
    echo "✅ $(basename "$f") aplicada"
  done
  exit 0
fi

# Aplica todas as migrações pendentes (em ordem)
for f in "$MIGRATIONS_DIR"/*.sql; do
  BASENAME=$(basename "$f")
  if [ -f "$(dirname "$0")/.applied/$BASENAME" ]; then
    echo "  ⏭  $BASENAME (já aplicada)"
    continue
  fi
  echo "  → Aplicando $BASENAME..."
  if docker exec -i "$DB_CONTAINER" psql -U postgres -d "$DB_NAME" < "$f" 2>&1 | grep -iE '^ERROR'; then
    echo "❌ Erro em $BASENAME (corrija antes de continuar)"
    exit 1
  fi
  touch "$(dirname "$0")/.applied/$BASENAME"
  echo "✅ $BASENAME aplicada"
done

echo "🎉 Todas as migrações aplicadas!"
