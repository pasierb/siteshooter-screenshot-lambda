import puppeteer from "puppeteer";
import { handlePage } from "./src/page-handler.mjs";

const browser = await puppeteer.launch({ headless: false });

await handlePage(browser, {
  url: "https://www.onetrust.com/products/cookie-consent/",
  width: 1920,
  height: 1080,
  removeEl: [],
});
