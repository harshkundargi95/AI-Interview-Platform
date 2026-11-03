import { validateProduction } from '../config.js'
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
export function localStorage() { return configuredStorage({ NODE_ENV: 'development' }) }
export function configuredStorage(env = process.env) {
  if (env.NODE_ENV === 'production') {
    validateProduction(env)
    return storageClient(new S3Client({ region: env.S3_REGION, endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true', maxAttempts: 1,
      requestHandler: { connectionTimeout: 2000, requestTimeout: 10000 },
      credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY },
    }), env.S3_BUCKET)
  }
  const client = new S3Client({ region: 'us-east-1', endpoint: 'http://127.0.0.1:4569', forcePathStyle: true, requestHandler: { connectionTimeout: 2000, requestTimeout: 10000 },
    credentials: { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' }, maxAttempts: 1 })
  return storageClient(client, 'resumes')
}
function storageClient(client, Bucket) {
  return {
    health: () => client.send(new HeadBucketCommand({ Bucket })),
    put: (Key, Body) => client.send(new PutObjectCommand({ Bucket, Key, Body, ContentType: 'application/octet-stream' })),
    get: async Key => (await client.send(new GetObjectCommand({ Bucket, Key }))).Body.transformToByteArray(),
    remove: Key => client.send(new DeleteObjectCommand({ Bucket, Key })),
  }
}
