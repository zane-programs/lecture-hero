import type { Request, Response } from "express";
import Controller from "../models/controller";

export default class ApiController extends Controller {
  private counter: number;
  constructor() {
    super();
    this.counter = 0;
  }

  handleIndex(req: Request, res: Response): void {
    res
      .status(200)
      .send({ data: "Hello from ApiController, " + this.counter++ });
  }

  async handleSleep(req: Request, res: Response): Promise<void> {
    const duration = parseInt(req.params.duration, 10);
    if (isNaN(duration) || duration > 10000 || duration < 0) {
      res
        .status(400)
        .send({ error: "Invalid duration (must be in 0 <= n <= 10000ms)" });
      return;
    }

    await new Promise((res) => setTimeout(res, duration));

    res.status(200).send({ data: "OK" });
  }

  handleConvert(req: Request, res: Response) {
    if (!("val" in req.query) || typeof req.query.val !== "string") {
      res.status(400).send({ error: "Missing val to convert" });
    }
    const base = parseInt(req.params.base, 10);
    if (base < 2 || base > 36) {
      res.status(400).send({ error: "Invalid base (must be in 2 <= n <= 36)" });
      return;
    }

    res.status(200).send({ data: parseInt(req.query.val as string, base) });
  }
}
