#!/bin/bash

# Migrate PostgreSQL DB schema from migration.sql
npx prisma migrate deploy

npm start