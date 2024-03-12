import { Express, Router } from "express";
import Route from "../models/route";
import V1Controller from "../controllers/v1";
import type DBClient from "../utils/db";
import SummaryRouter from "./summary";

export default class V1Router extends Route<V1Controller> {
  constructor(db: DBClient) {
    super(new V1Controller(), db);
  }

  register(app: Express | Router, path: string): void {
    super.register(app, path);

    this.router.get("/", this.controller.handleIndex.bind(this.controller));
    this.router.get(
      "/health",
      this.controller.handleHealthCheck.bind(this.controller)
    );
    this.router.put(
      "/register",
      this.controller.handleRegister.bind(this.controller)
    );

    new SummaryRouter(this.db).register(this.router, "/summary");
  }
}
