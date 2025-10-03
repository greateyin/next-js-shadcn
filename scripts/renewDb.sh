#!/bin/bash

# 設定環境變數 (如果有 .env)
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🚀 強制重建 Prisma 資料庫..."

# 檢查是否有定義 DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 未設定，請確認 .env 檔案"
    exit 1
fi

echo "🛑 刪除舊的 Prisma 資料庫..."
npx prisma db execute --file <(echo "DROP DATABASE IF EXISTS $(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/'); CREATE DATABASE $(echo $DATABASE_URL | sed -E 's/.*\/([^?]+).*/\1/');") --preview-feature

echo "📦 重新生成 Prisma Client..."
npx prisma generate

echo "📤 強制推送 Prisma Schema (跳過遷移)..."
npx prisma db push --force-reset

pnpm prisma:seed

echo "✅ Prisma 資料庫已重建完成！"
