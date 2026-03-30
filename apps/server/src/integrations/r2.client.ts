import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

export type R2Config = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrlBase?: string
}

export function createR2Client(cfg: R2Config) {
  const endpoint = `https://${cfg.accountId}.r2.cloudflarestorage.com`
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  })

  return {
    async putObject(key: string, body: Buffer | Uint8Array | string, contentType?: string) {
      await client.send(
        new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      )
      return cfg.publicUrlBase ? `${cfg.publicUrlBase.replace(/\/$/, '')}/${key}` : key
    },
    async getObject(key: string) {
      const out = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: key }))
      return out.Body
    },
    async deleteObject(key: string) {
      await client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key: key }))
    },
  }
}
