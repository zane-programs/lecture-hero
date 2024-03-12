import { Express } from "express";
import Route from "../models/route";
import MainController from "../controllers/main";

export default class MainRouter extends Route<MainController> {
  constructor() {
    super(new MainController());
  }

  register(app: Express, path: string): void {
    super.register(app, path);

    this.router.get("/", this.controller.handleIndex.bind(this.controller));
    this.router.get("/demo", this.controller.handleDemo.bind(this.controller));
  }
}
