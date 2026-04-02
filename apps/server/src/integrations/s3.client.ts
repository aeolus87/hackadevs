import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { ServerEnv } from '@hackadevs/config'

type S3UploadConfig = {
  client: S3Client
  bucket: string
}

function resolveUploadS3(env: ServerEnv): S3UploadConfig | null {
  if (
    env.CLOUDFLARE_R2_ACCOUNT_ID &&
    env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    env.CLOUDFLARE_R2_BUCKET
  ) {
    const endpoint = `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    return {
      bucket: env.CLOUDFLARE_R2_BUCKET,
      client: new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
          secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        },
      }),
    }
  }
  if (env.AWS_S3_BUCKET && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
    return {
      bucket: env.AWS_S3_BUCKET,
      client: new S3Client({
        region: env.AWS_REGION ?? 'us-east-1',
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
        ...(env.S3_ENDPOINT ? { endpoint: env.S3_ENDPOINT, forcePathStyle: true } : {}),
      }),
    }
  }
  return null
}

export async function getPresignedPutObjectUrl(
  env: ServerEnv,
  key: string,
  contentType: string,
  expiresInSeconds: number,
): Promise<string | null> {
  const cfg = resolveUploadS3(env)
  if (!cfg) return null
  const cmd = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(cfg.client, cmd, { expiresIn: expiresInSeconds })
}
