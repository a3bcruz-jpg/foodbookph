# FoodBookPH

FoodBookPH Phase 1 MVP: a Philippine food discovery and dining-experience network.

## Run in GitHub Codespaces

```bash
npm install
npm run dev
```

Open the forwarded port `3000` in the Ports panel. Use `npm run build && npm start` to verify the production build.

The current MVP uses typed local seed data and a process-local account repository when no `DATABASE_URL` is configured. PostgreSQL-ready identity and session entities are defined in `prisma/schema.prisma`; copy `.env.example` to `.env` and add a database URL before deploying persistent accounts. Passwords are salted and hashed with Node `scrypt`, and sessions use HttpOnly cookies.

Customer account routes:

- `/register` — create a customer identity
- `/login` — start a session
- `/profile` — protected profile view
- `/settings` — protected profile and password editing
