import { Express } from "express";
import Route from "../models/route";
import ApiController from "../controllers/api";

export default class ApiRouter extends Route<ApiController> {
  constructor() {
    super(new ApiController());
  }

  register(app: Express, path: string): void {
    super.register(app, path);

    this.router.get("/", this.controller.handleIndex.bind(this.controller));
    this.router.get(
      "/sleep/:duration",
      this.controller.handleSleep.bind(this.controller)
    );
    this.router.get(
      "/convert/:base",
      this.controller.handleConvert.bind(this.controller)
    );
  }
}
