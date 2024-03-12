import { Router, type Express } from "express";
import type DBClient from "../utils/db";

export default class Controller {
  protected app: Express | Router | undefined;
  protected db: DBClient | undefined;

  constructor() {}

  setApp(app: Express | Router): void {
    this.app = app;
  }

  setDb(db: DBClient): void {
    this.db = db;
  }
}
