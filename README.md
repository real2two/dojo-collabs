# thread star bot

To install dependencies:

```bash
bun install
```

To run:

```bash
bun start
```

To migrate database:

```bash
bun schema/migrate
```

This project was created using `bun init` in bun v1.2.16. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Notes / Warnings

Here are additional notes I wrote for myself:

### TODO

- Give the collab cooldown role if the user left and joined back the server.

### Main comments

- I used [`DrizzleORM`](https://orm.drizzle.team/) _(ORM)_ + [`PostgreSQL`](https://www.postgresql.org/) _(database)_ for this project. You can use the script `bun schema/push` _(to forcefully push data, FOR TESTING ONLY - DO NOT USE IN PRODUCTION)_ and `bun schema/generate` _(to generate new schemas you can use for `bun schema/migrate`)_ as well.
- I wrote my own gateway client class using some [`discordeno`](https://discordeno.js.org/) libraries, which I really shouldn't have done. This was really for fun and toying around with things. It shouldn't be hard to move to another bot library.

### "WARNING:" comments

- One is about a potential timed race condition (shouldn't be a big issue).
- The other is about how the bot caches all "pending collabs" (aka collabs that haven't reached the star goal yet) in memory (shouldn't be an issue based on the activity of collabs channel as of the time writing this but it's something to consider).
