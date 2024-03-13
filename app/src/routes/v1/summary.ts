import { Express, Router } from "express";
import Route from "../../models/route";
import SummaryController from "../../controllers/v1/summary";
import type DBClient from "../../utils/db";

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

    this.router.put(
      "/create",
      this.checkAuthMiddleware.bind(this),
      this.controller.createSummary.bind(this.controller)
    );

    this.router.get(
      "/get/:summaryId",
      this.controller.getSummary.bind(this.controller)
    );
  }
}
