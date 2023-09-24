import { jest } from "@jest/globals";

import puppeteer from "puppeteer";
import { createHandler } from "../../../src/handlers/factory.mjs";
import { BaseAuthenticator } from "../../../src/authenticator.mjs";
import { BaseStore } from "../../../src/store.mjs";

describe("createScreenshot", () => {
  let browser;
  let authenticator;
  let store;
  let handler;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new" });
    authenticator = new BaseAuthenticator();
    store = new BaseStore();
  });

  beforeEach(() => {
    authenticator.isAuthenticated = jest.fn().mockReturnValue(true);
    store.exists = jest.fn().mockReturnValue(false);
    store.save = jest.fn().mockReturnValue(Promise.resolve());

    handler = createHandler({ browser, authenticator, store });
  });

  test("happy path", async () => {
    const result = await handler({
      body: JSON.stringify({
        url: "https://google.com/",
        width: 800,
        height: 600,
      }),
    });

    expect(result.statusCode).toBe(200);
  }, 35000);

  test("unauthenticated returns 401", async () => {
    authenticator.isAuthenticated.mockReturnValue(false);

    const result = await handler({
      body: JSON.stringify({
        url: "https://google.com/",
        width: 800,
        height: 600,
      }),
    });

    expect(result.statusCode).toBe(401);
  });
});
