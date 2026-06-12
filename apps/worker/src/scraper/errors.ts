export class CaptchaDetectedError extends Error {
  constructor(message = "Google Maps CAPTCHA detected") {
    super(message);
    this.name = "CaptchaDetectedError";
  }
}

export class SearchCancelledError extends Error {
  constructor(message = "Search cancelled") {
    super(message);
    this.name = "SearchCancelledError";
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
