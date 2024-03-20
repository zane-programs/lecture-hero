import type { Request, Response } from "express";
import Controller from "../../models/controller";

export default class V1Controller extends Controller {
  constructor() {
    super();
  }

  handleIndex(req: Request, res: Response): void {
    res.status(200).send({ data: "Hello, World!" });
  }

  handleHealthCheck(req: Request, res: Response): void {
    res.status(200).send({ data: "ok" });
  }

  async handleRegister(req: Request, res: Response): Promise<void> {
    if (
      !req.body ||
      typeof req.body.username !== "string" ||
      typeof req.body.password !== "string"
    ) {
      res.status(400).send({ error: "Missing username and/or password" });
      return;
    }

    const { username, password } = req.body;

    try {
      await this.db!.createUser(username, password);
      res.status(200).send({
        data: "ok",
      });
    } catch (error) {
      if ((error || (undefined as any))?.meta.target.includes("username")) {
        // 422 Unprocessable Entity
        res.status(422).send({ error: "Username unavailable" });
        return;
      }

      // Otherwise generic 500
      res
        .status(500)
        .send({ error: "Could not register due to internal server error" });
    }
  }
}
