# Database Migrations

This directory contains database migration scripts for the Roulette Monitor system.

## Migration System

The migration system uses SQL files in the `migrations` directory. Each migration file should be named with a sequential number and a descriptive name, like `0001_initial_schema.sql`.

## How to Use

1. **Create a new migration**:
   - Create a new SQL file in the `migrations` directory with the next sequential number
   - Write your SQL statements in the file
   - The file will be executed in alphabetical order

2. **Run migrations**:
   ```bash
   node backend/db/migrate.js
   ```

3. **Check migration status**:
   The system keeps track of applied migrations in the `migrations` table.

## Migration Rules

- Always include `IF NOT EXISTS` or `IF EXISTS` in your SQL to make migrations idempotent
- Never modify a migration file after it has been applied to production
- Always test migrations in a development environment first
- Include comments explaining the purpose of each migration

## Database Schema

### roulette_history
Stores the main roulette game results.

### roulette_patterns
Tracks patterns in the roulette results for analysis.
