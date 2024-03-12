// src/types/express/index.d.ts

import type { AuthObject } from "./auth";

// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      auth?: AuthObject;
    }
  }
}
