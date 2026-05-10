import sanitizeHtml from "sanitize-html";
import { Request, Response, NextFunction } from "express";

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction) {
  if (req.body && typeof req.body === "object") {
    sanitizeObject(req.body);
  }
  next();
}

function sanitizeObject(obj: Record<string, any>) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeHtml(obj[key], { allowedTags: [], allowedAttributes: {} });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}
