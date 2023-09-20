import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const { CLOUDFRONT_DISTRIBUTION_DOMAIN_NAME, OUTPUT_BUCKET_NAME } = process.env;

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
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

async function createScreenshot(key, config) {
  const { url, width, height } = config;

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(url);
  await page.setViewport({ width, height });
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
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
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
