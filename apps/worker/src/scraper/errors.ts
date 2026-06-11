export class CaptchaDetectedError extends Error {
  constructor(message = "Google Maps CAPTCHA detected") {
    super(message);
    this.name = "CaptchaDetectedError";
  }
}

export class BrowserPoolExhaustedError extends Error {
  constructor(maxConcurrency: number) {
    super(
      `Browser pool exhausted: maximum concurrency of ${maxConcurrency} reached`,
    );
    this.name = "BrowserPoolExhaustedError";
  }
}
