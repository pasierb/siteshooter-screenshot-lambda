import puppeteer from "puppeteer-core";

/**
 *
 * @param {Page} page
 * @param {string} selector
 */
async function scrollToSelector(page, selector) {
  if (!selector) {
    return;
  }

  await page.$(selector).then((el) => el?.scrollIntoView());
}

/**
 *
 * @param {Page} page
 * @param {string[]} selectors
 */
async function removeElements(page, selectors) {
  if (!selectors || !selectors.length === 0) {
    return;
  }

  await Promise.all(
    selectors.map((selector) =>
      page.$$eval(selector, (elements) => elements.forEach((el) => el.remove()))
    )
  );
}

/**
 * Attempt to close cookie banners.
 *
 * @param {Page} page
 */
async function maybeCloseCookieBanners(page) {
  // https://www.onetrust.com/products/cookie-consent/
  if (await page.$("#onetrust-consent-sdk")) {
    await page.click("#onetrust-accept-btn-handler");
    return;
  }

  // Others...
  // await page.$$()
}

/**
 * @param {Browser} browser
 * @returns {Promise<Page>}
 */
export async function handlePage(browser, config) {
  const { url, width, height, removeEl = [], scrollIntoView } = config;

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });

  // Set the viewport to desired dimensions.
  await page.setViewport({ width, height });
  await maybeCloseCookieBanners(page);
  // Remove elements from the page.
  await removeElements(page, removeEl);
  // Scroll to the element.
  await scrollToSelector(page, scrollIntoView);

  return page;
}
