import { parseHTML } from "linkedom";
import type { Browser, BrowserContext, Locator, Page } from "playwright";

function triggerClick(element: Element): void {
  const view = element.ownerDocument?.defaultView;
  if (view && typeof view.Event === "function") {
    element.dispatchEvent(new view.Event("click", { bubbles: true }));
  } else if ("click" in element && typeof element.click === "function") {
    element.click();
  }

  const panel = element.ownerDocument?.querySelector('[data-testid="detail-panel"]');
  const HTMLElementCtor = view?.HTMLElement;
  if (!panel || !HTMLElementCtor || !(panel instanceof HTMLElementCtor)) {
    return;
  }

  const dataset = (element as HTMLElement).dataset;
  if (dataset.detailPhone) {
    panel.hidden = false;
    panel.querySelector('[data-testid="detail-phone"]')!.textContent =
      dataset.detailPhone;
    const websiteLink = panel.querySelector(
      '[data-testid="detail-website"]',
    ) as HTMLAnchorElement | null;
    if (websiteLink && dataset.detailWebsite) {
      websiteLink.href = dataset.detailWebsite;
      websiteLink.textContent = dataset.detailWebsite;
    }
  }
}

function createLocator(root: ParentNode, selector: string): Locator {
  const resolveElements = (): Element[] => {
    if (selector === "__none__") {
      return [];
    }
    return Array.from(root.querySelectorAll(selector));
  };

  const locator = {
    count: async () => resolveElements().length,
    textContent: async () => resolveElements()[0]?.textContent?.trim() ?? null,
    getAttribute: async (name: string) =>
      resolveElements()[0]?.getAttribute(name) ?? null,
    first: () => {
      const element = resolveElements()[0];
      return element ? createElementLocator(element) : createLocator(root, "__none__");
    },
    nth: (index: number) => {
      const element = resolveElements()[index];
      return element ? createElementLocator(element) : createLocator(root, "__none__");
    },
    filter: ({ has }: { has: Locator }) => {
      const hasSelector = (has as LocatorWithSelector).__selector ?? "__none__";
      const matching = resolveElements().filter(
        (element) => element.querySelector(hasSelector) !== null,
      );

      return createElementsLocator(root, matching);
    },
    click: async () => {
      const element = resolveElements()[0];
      if (element) {
        triggerClick(element);
      }
    },
    waitFor: async ({ state }: { state: string }) => {
      if ((state === "attached" || state === "visible") && resolveElements().length === 0) {
        throw new Error(`Element not found for selector: ${selector}`);
      }
    },
    locator: (childSelector: string) => {
      const element = resolveElements()[0];
      return element
        ? createLocator(element, childSelector)
        : createLocator(root, "__none__");
    },
    evaluate: async (fn: (element: Element) => void) => {
      const element = resolveElements()[0];
      if (element) {
        fn(element);
      }
    },
  } as LocatorWithSelector;

  locator.__selector = selector;
  return locator;
}

type LocatorWithSelector = Locator & { __selector?: string };

function createElementsLocator(root: ParentNode, elements: Element[]): Locator {
  return {
    count: async () => elements.length,
    textContent: async () => elements[0]?.textContent?.trim() ?? null,
    getAttribute: async (name: string) => elements[0]?.getAttribute(name) ?? null,
    first: () => (elements[0] ? createElementLocator(elements[0]) : createLocator(root, "__none__")),
    nth: (index: number) =>
      elements[index]
        ? createElementLocator(elements[index])
        : createLocator(root, "__none__"),
    filter: () => createLocator(root, "__none__"),
    click: async () => {
      if (elements[0]) {
        triggerClick(elements[0]);
      }
    },
    waitFor: async ({ state }: { state: string }) => {
      if ((state === "attached" || state === "visible") && elements.length === 0) {
        throw new Error("Element not found for filtered locator");
      }
    },
    locator: (childSelector: string) =>
      elements[0]
        ? createLocator(elements[0], childSelector)
        : createLocator(root, "__none__"),
  } as Locator;
}

function createElementLocator(element: Element): Locator {
  return {
    count: async () => 1,
    textContent: async () => element.textContent?.trim() ?? null,
    getAttribute: async (name: string) => element.getAttribute(name),
    first: () => createElementLocator(element),
    nth: () => createElementLocator(element),
    filter: ({ has }: { has: Locator }) => {
      const hasSelector = (has as LocatorWithSelector).__selector ?? "__none__";
      if (!element.querySelector(hasSelector)) {
        return createLocator(element, "__none__");
      }
      return createElementLocator(element);
    },
    click: async () => {
      triggerClick(element);
    },
    waitFor: async () => undefined,
    locator: (childSelector: string) => createLocator(element, childSelector),
  } as Locator;
}

export function createHasLocator(selector: string): Locator {
  return { __selector: selector } as unknown as Locator;
}

export function createMockPage(html: string): Page {
  let { document } = parseHTML(html, { runScripts: true });
  let viewportWidth = 1280;
  let viewportHeight = 720;

  return {
    locator: (selector: string) => createLocator(document, selector),
    setContent: async (nextHtml: string) => {
      ({ document } = parseHTML(nextHtml, { runScripts: true }));
    },
    setViewportSize: async ({ width, height }: { width: number; height: number }) => {
      viewportWidth = width;
      viewportHeight = height;
    },
    waitForTimeout: async () => undefined,
    evaluate: async <T>(fn: () => T): Promise<T> => {
      const previousDocument = globalThis.document;
      const previousWindow = globalThis.window;
      globalThis.document = document as unknown as Document;
      globalThis.window = {
        innerWidth: viewportWidth,
        innerHeight: viewportHeight,
      } as Window & typeof globalThis.window;
      try {
        return fn();
      } finally {
        globalThis.document = previousDocument;
        globalThis.window = previousWindow;
      }
    },
    close: async () => undefined,
  } as unknown as Page;
}

export function createMockBrowser(html: string): Browser {
  const page = createMockPage(html);
  const context = {
    newPage: async () => page,
    close: async () => undefined,
  } as BrowserContext;

  return {
    newContext: async () => context,
    close: async () => undefined,
  } as Browser;
}
