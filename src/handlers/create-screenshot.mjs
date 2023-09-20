import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const handler = async (event) => {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://familyfunmap.ch/");
    const buffer = await page.screenshot();

    return {
      statusCode: 200,
      body: buffer.toString("base64"),
    };
  } catch (err) {
    console.log(err);

    return {
      statusCode: 500,
    };
  }
};
