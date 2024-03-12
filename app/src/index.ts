import express from "express";
import winston from "winston";
import expressWinston from "express-winston";
import { config as dotenvConfig } from "dotenv";

// DB
import DBClient from "./utils/db";

// Routes
import V1Router from "./routes/v1";

// Grab env variables
dotenvConfig();
const PORT = process.env.LECTURE_HERO_PORT || 3000;

const app = express();
app.disable("x-powered-by");
app.use(express.json());

// Logger
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      winston.format((info) => {
        info.level = info.level.toUpperCase();
        return info;
      })(),
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.json(),
      winston.format.printf(
        (info) => `${info.timestamp} [${info.level}] ${info.message}`
      )
    ),
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
  })
);

// Database client
const db = new DBClient();

// Connect to database
db.connect()
  .then(() => {
    // Register routes
    new V1Router(db).register(app, "/v1");

    // Catch-all 404
    // app.all("*", (_, res) => res.status(404).send({ error: "Not Found" }));

    // Listen on app port
    app.listen(PORT, () => console.log("Server listening on port", PORT));
  })
  .catch((error) => {
    console.log("DB Error:");
    console.error(error);
    process.exit(1);
  });

async function cleanUp() {
  // Disconnect Prisma instance from Postgres
  await db.disconnect();
  process.exit(0);
}

// Thx https://stackoverflow.com/a/49392671
[
  `exit`,
  `SIGINT`,
  `SIGUSR1`,
  `SIGUSR2`,
  `uncaughtException`,
  `SIGTERM`,
].forEach((eventType) => {
  process.on(eventType, cleanUp);
});
