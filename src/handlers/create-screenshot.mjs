import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
const { createHash } = await import("node:crypto");

chromium.font(
  new URL("./../../fonts/NotoColorEmoji.ttf", import.meta.url).pathname
);

const {
  CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME,
  OUTPUT_BUCKET_NAME,
  AWS_REGION,
  ACCESS_KEY,
} = process.env;
const s3Client = new S3Client({ region: AWS_REGION });

function simpleHash(str) {
  const hash = createHash("sha256");
  hash.update(str);

  return hash.digest("hex");
}

function isAuthenticated(event) {
  const auth = event.headers.Authorization || event.headers.authorization;

  return auth === `Bearer ${ACCESS_KEY}`;
}

function keyExists(key) {
  return s3Client
    .send(
      new HeadObjectCommand({
        Bucket: OUTPUT_BUCKET_NAME,
        Key: key,
      })
    )
    .then(() => true)
    .catch((err) => {
      console.log(JSON.stringify(err, null, 2));

      if (err.name === "403") {
        return false;
      }

      throw err;
    });
}

function screenshotUrl(key) {
  return new URL(
    key,
    `https://${CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME}`
  ).toString();
}

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

async function createScreenshot(key, config) {
  const { url, width, height, removeEl = [], scrollIntoView } = config;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(url);

  // Set the viewport to desired dimensions.
  await page.setViewport({ width, height });
  // Remove elements from the page.
  await removeElements(page, removeEl);
  // Scroll to the element.
  await scrollToSelector(page, scrollIntoView);

  const buffer = await page.screenshot();
  const command = new PutObjectCommand({
    Bucket: process.env.OUTPUT_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: "image/png",
  });
  await s3Client.send(command);
}

export const handler = async (event) => {
  if (!isAuthenticated(event)) {
    return {
      statusCode: 401,
      body: "Unauthorized",
    };
  }

  const config = JSON.parse(event.body);
  const screenshotKey = simpleHash(event.body);
  const exists = await keyExists(screenshotKey);

  if (!exists) {
    await createScreenshot(screenshotKey, config);
  }

  return {
    statusCode: 200,
    body: screenshotUrl(screenshotKey),
  };
};
