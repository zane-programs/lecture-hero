import type { Request, Response } from "express";
import Controller from "../models/controller";

export default class MainController extends Controller {
  constructor() {
    super();
  }

  handleIndex(req: Request, res: Response): void {
    res.status(200).send("Hello from MainController");
  }

  handleDemo(req: Request, res: Response): void {
    res.setHeader("content-type", "text/plain");
    res.status(200).send(req.query.test ?? "Nothing provided!");
  }
}
