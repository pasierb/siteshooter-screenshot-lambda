import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { S3Client } from "@aws-sdk/client-s3";
import { Authenticator } from "../authenticator.mjs";
import { ScreenshotStore } from "../store.mjs";
import { createHandler } from "./factory.mjs";

chromium.font(
  new URL("./../../fonts/NotoColorEmoji.ttf", import.meta.url).pathname
);

const { OUTPUT_BUCKET_NAME, AWS_REGION, ACCESS_KEY } = process.env;
const authenticator = new Authenticator(ACCESS_KEY);
const s3Client = new S3Client({ region: AWS_REGION });
const store = new ScreenshotStore(s3Client, OUTPUT_BUCKET_NAME);

const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});
export const handler = createHandler({ browser, authenticator, store });
