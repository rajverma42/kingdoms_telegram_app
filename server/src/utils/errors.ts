export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notEnoughResource(resource: string) {
  return new ApiError(400, `INSUFFICIENT_${resource.toUpperCase()}`, `Not enough ${resource}.`);
}

export function notFound(what: string) {
  return new ApiError(404, "NOT_FOUND", `${what} not found.`);
}

export function badRequest(message: string, code = "BAD_REQUEST") {
  return new ApiError(400, code, message);
}

export function unauthorized(message = "Authentication required.") {
  return new ApiError(401, "UNAUTHORIZED", message);
}
