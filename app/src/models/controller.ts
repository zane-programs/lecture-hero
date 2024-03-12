import { type Express } from "express";

export default class Controller {
  protected app: Express | undefined;

  constructor() {}

  setApp(app: Express): void {
    this.app = app;
  }
}
