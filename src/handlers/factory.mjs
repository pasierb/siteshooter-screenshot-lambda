import { Authenticator } from "../authenticator.mjs";
import { handlePage } from "../page-handler.mjs";
import { ScreenshotStore } from "../store.mjs";

const {
  CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME,
  OUTPUT_BUCKET_NAME,
  AWS_REGION,
  ACCESS_KEY,
} = process.env;

/**
 * @typedef CreateHandlerConfig
 * @type {object}
 * @property {Browser} browser - puppeteer Browser.
 * @property {Authenticator} authenticator - authenticator.
 * @property {ScreenshotStore} store - screenshot store.
 */

function screenshotUrl(key) {
  return new URL(
    key,
    `https://${CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME}`
  ).toString();
}

/**
 *
 * @param {CreateHandlerConfig} config
 * @returns {Handler}
 */
export function createHandler(config) {
  const { browser, authenticator, store } = config;

  return async function handler(event) {
    if (!authenticator.isAuthenticated(event)) {
      return {
        statusCode: 401,
        body: "Unauthorized",
      };
    }

    const config = JSON.parse(event.body);
    const screenshotKey = config.imageKey;
    const exists = await store.exists(screenshotKey);

    if (!exists) {
      let page;
      try {
        page = await handlePage(browser, config);
        await store.save(screenshotKey, await page.screenshot());
      } finally {
        page.close();
      }
    }

    return {
      statusCode: 200,
      body: screenshotUrl(screenshotKey),
    };
  };
}
