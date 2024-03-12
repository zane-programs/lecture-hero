import { Router, type Express } from "express";
import type Controller from "./controller";

export default class Route<T extends Controller = Controller> {
  protected controller: T;
  protected router: Router;

  constructor(controller: T) {
    this.controller = controller;
    this.router = Router();
  }

  register(app: Express, path: string): void {
    app.use(path, this.router);
    this.controller.setApp(app);
  }
}
