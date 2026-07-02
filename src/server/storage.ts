import "server-only";

import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

const DEFAULT_BUCKET_NAME = "monoasobi-contents";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
}

type R2Body = NonNullable<GetObjectCommandOutput["Body"]> & {
  transformToWebStream?: () => ReadableStream<Uint8Array>;
  transformToByteArray?: () => Promise<Uint8Array>;
};

const getR2Config = (): R2Config => {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY are required",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: process.env.R2_BUCKET_NAME ?? DEFAULT_BUCKET_NAME,
    endpoint:
      process.env.R2_ENDPOINT ??
      process.env.R2_END_POINT ??
      `https://${accountId}.r2.cloudflarestorage.com`,
  };
};

let r2Client: S3Client | undefined;

const getR2Client = () => {
  if (r2Client) return r2Client;

  const config = getR2Config();
  r2Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
};

export const getR2Object = async (key: string) => {
  const config = getR2Config();

  try {
    return await getR2Client().send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "NoSuchKey" || error.name === "NotFound")
    ) {
      return null;
    }

    throw error;
  }
};

export const listR2ObjectKeys = async (prefix: string) => {
  const config = getR2Config();
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const output = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    output.Contents?.forEach((object) => {
      if (object.Key) keys.push(object.Key);
    });

    continuationToken = output.NextContinuationToken;
  } while (continuationToken);

  return keys;
};

export const r2BodyToResponseBody = async (
  body: GetObjectCommandOutput["Body"],
): Promise<BodyInit | null> => {
  if (!body) return null;

  const r2Body = body as R2Body;
  if (typeof r2Body.transformToWebStream === "function") {
    return r2Body.transformToWebStream();
  }

  if (typeof r2Body.transformToByteArray === "function") {
    const bytes = await r2Body.transformToByteArray();
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    return arrayBuffer;
  }

  return body as BodyInit;
};
