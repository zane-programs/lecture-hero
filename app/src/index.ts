import express from "express";
import winston from "winston";
import expressWinston from "express-winston";

import { config as dotenvConfig } from "dotenv";

import MainRouter from "./routes/main";
import ApiRouter from "./routes/api";

// Grab env variables
dotenvConfig();
const PORT = process.env.LECTURE_HERO_PORT || 3000;

const app = express();
app.disable("x-powered-by");

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

// Register routes
new MainRouter().register(app, "/");
new ApiRouter().register(app, "/api");

app.all("*", (_, res) => res.status(404).send({ error: "Not Found" }));

app.listen(PORT, () => console.log("Server listening on port", PORT));
