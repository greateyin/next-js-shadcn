export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class RateLimitError extends Error {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(message);
    this.name = "RateLimitError";
  }
}
