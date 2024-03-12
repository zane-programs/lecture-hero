import type { Request, Response } from "express";
import Controller from "../models/controller";

export default class SummaryController extends Controller {
  constructor() {
    super();
  }

  async handleIndex(req: Request, res: Response): Promise<void> {
    console.log("NOTES", await this.db?.getNotes());
    res.status(200).send({ data: "Hello from SummaryController!" });
  }
}
