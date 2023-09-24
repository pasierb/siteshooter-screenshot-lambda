import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

export class BaseStore {
  exists(key) {
    throw new Error("Not implemented");
  }

  save(key, buffer) {
    throw new Error("Not implemented");
  }
}

export class ScreenshotStore extends BaseStore {
  /**
   *
   * @param {S3Client} client
   * @param {string} bucketName
   */
  constructor(client, bucketName) {
    super();
    this.client = client;
    this.bucketName = bucketName;
  }

  exists(key) {
    return this.client
      .send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
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

  save(key, buffer) {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: "image/png",
    });
    return this.client.send(command);
  }
}
