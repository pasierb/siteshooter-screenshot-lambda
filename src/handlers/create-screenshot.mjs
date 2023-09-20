import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  const screenshotKey = "screenshot.png";

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

    const command = new PutObjectCommand({
      Bucket: process.env.OUTPUT_BUCKET_NAME,
      Key: screenshotKey,
      Body: buffer,
      ContentType: "image/png",
    });
    await s3Client.send(command);

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
