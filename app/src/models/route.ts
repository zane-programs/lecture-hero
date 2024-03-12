import {
  Router,
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import type Controller from "./controller";
import type DBClient from "../utils/db";

export default class Route<T extends Controller = Controller> {
  protected controller: T;
  protected router: Router;
  protected db: DBClient;

  constructor(controller: T, db: DBClient) {
    this.controller = controller;
    this.router = Router({ mergeParams: true });
    this.db = db;

    this.controller.setDb(this.db);
  }

  register(app: Express | Router, path: string): void {
    if (typeof app.route === "function") {
      (app as Router).use(path, this.router);
    } else {
      (app as Express).use(path, this.router);
    }
    this.controller.setApp(app);
  }

  protected async checkAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Check for auth header
      const { authorization: authHeader } = req.headers;
      if (!authHeader) {
        res.status(401).send({ error: "Missing Authorization header" });
        return;
      }

      // Verify structure of LazyAuth header
      const authSplit = authHeader.split(" ");
      if (authSplit[0] !== "LazyAuth" || authSplit.length !== 2) {
        res.status(401).send({
          // Yeah fight me. I was too lazy to create sessions and JWTs.
          error:
            "Malformed Authorization header (I made this stupid LazyAuth format because I'm, well, lazy)",
        });
        return;
      }

      // Header looks like:
      // `Authorization: LazyAuth ${encodeURIComponent(username)}:${encodeURIComponent(password)}`
      const [username, password] = atob(authSplit[1])
        .split(":")
        .map((item) => decodeURIComponent(item));

      // Check user auth
      const isAuthed = await this.db.checkAuth(username, password);
      if (!isAuthed) {
        res.status(401).send({
          error: "Invalid credentials",
        });
        return;
      }

      // Inject auth info into `req` (just username for now)
      req.auth = { username };

      // Woohoo we made it! Hell yeah
      next();
    } catch (e) {
      console.error(e);
      res.status(500).send({ error: "Internal server error" });
    }
  }
}
