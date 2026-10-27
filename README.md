# Collabs Bot

This is the source code for the Collabs Bot in the Hyun Dojo Community's Discord server.

## Setup

To install dependencies:

```bash
pnpm install
```

Copy `.env.example` to `.env` and fill in your values.

To run:

```bash
pnpm start
```

To run in development (watch mode):

```bash
pnpm dev
```

To migrate database:

```bash
pnpm schema/migrate
```

## Notes / Warnings

Here are additional notes I wrote for myself:

### Main comments

- I used [`DrizzleORM`](https://orm.drizzle.team/) _(ORM)_ + [`SQLite`](https://www.sqlite.org/) _(database)_ for this project. The database file is configured with `DATABASE_URL` in `.env`. You can use the script `pnpm schema/push` _(to forcefully push data, FOR TESTING ONLY - DO NOT USE IN PRODUCTION)_ and `pnpm schema/generate` _(to generate new schemas you can use for `pnpm schema/migrate`)_ as well.
- I wrote my own gateway client class using some [`discordeno`](https://discordeno.js.org/) libraries, which I really shouldn't have done. This was really for fun and toying around with things. It shouldn't be hard to move to another bot library.
- Linting and formatting are handled with [oxc](https://oxc.rs/) via `pnpm lint` and `pnpm format`.

### "WARNING:" comments

- One is about a potential timed race condition (shouldn't be a big issue).
- The other is about how the bot caches all "pending collabs" (aka collabs that haven't reached the star goal yet) in memory (shouldn't be an issue based on the activity of collabs channel as of the time writing this but it's something to consider).
