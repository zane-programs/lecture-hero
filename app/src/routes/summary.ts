import { Express, Router } from "express";
import Route from "../models/route";
import SummaryController from "../controllers/summary";
import type DBClient from "../utils/db";

export default class SummaryRouter extends Route<SummaryController> {
  constructor(db: DBClient) {
    super(new SummaryController(), db);
  }

  register(app: Express | Router, path: string): void {
    super.register(app, path);

    this.router.get(
      "/",
      this.checkAuthMiddleware.bind(this),
      this.controller.handleIndex.bind(this.controller)
    );
  }
}
