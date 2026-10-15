import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
export function localStorage() {
  const client = new S3Client({ region: 'us-east-1', endpoint: 'http://127.0.0.1:4569', forcePathStyle: true, requestHandler: { connectionTimeout: 2000, requestTimeout: 10000 },
    credentials: { accessKeyId: 'S3RVER', secretAccessKey: 'S3RVER' }, maxAttempts: 1 })
  const Bucket = 'resumes'
  return {
    put: (Key, Body) => client.send(new PutObjectCommand({ Bucket, Key, Body, ContentType: 'application/octet-stream' })),
    get: async Key => (await client.send(new GetObjectCommand({ Bucket, Key }))).Body.transformToByteArray(),
    remove: Key => client.send(new DeleteObjectCommand({ Bucket, Key })),
  }
}
