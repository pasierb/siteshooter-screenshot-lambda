import { handlePage } from "../../src/page-handler.mjs";

const defaultConfig = {
  width: 1600,
  height: 900,
};

describe("handlePage", () => {
  test("closes ", async () => {
    const page = await handlePage(browser, {
      ...defaultConfig,
      url: "https://www.onetrust.com/products/cookie-consent/",
    });

    expect(await page.$$("#onetrust-banner-sdk")).toBe(null);
  });
});
