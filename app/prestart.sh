#!/bin/bash

# Set database url env variable
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# Migrate PostgreSQL DB schema from migration.sql
npx prisma migrate deploy
npx prisma generate

npm start