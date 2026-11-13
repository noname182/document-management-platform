import { Injectable, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly quarantineBucket = process.env.MINIO_BUCKET_QUARANTINE || 'quarantine-vault';
  private readonly processedBucket = process.env.MINIO_BUCKET_PROCESSED || 'processed-documents';
  private readonly auditBucket = process.env.MINIO_BUCKET_AUDIT || 'audit-logs';

  constructor() {
    this.s3Client = new S3Client({
      endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio_admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio_secret_key',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.ensureBucketsExist();
  }

  private async ensureBucketsExist() {
    const buckets = [
      this.quarantineBucket,
      this.processedBucket,
      this.auditBucket,
    ];

    for (const bucket of buckets) {
      try {
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
        this.logger.log(`Bucket verificado: ${bucket}`);
      } catch {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
          this.logger.log(`Bucket creado exitosamente: ${bucket}`);
        } catch (createError) {
          this.logger.error(`No se pudo crear el bucket ${bucket}`, createError);
        }
      }
    }
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  // 1. Validar Magic Bytes e Integridad SHA-256
  async inspectAndHash(fileBuffer: Buffer) {
    const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<typeof import('file-type')>);
    const fileTypeResult = await fileTypeFromBuffer(fileBuffer);

    const allowedMimeTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ];

    if (!fileTypeResult || !allowedMimeTypes.includes(fileTypeResult.mime)) {
      throw new BadRequestException(
        `Tipo de archivo inválido o manipulado. Detectado: ${fileTypeResult?.mime || 'desconocido'}`,
      );
    }

    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    return {
      mime: fileTypeResult.mime,
      ext: fileTypeResult.ext,
      hash: sha256Hash,
    };
  }

  // 2. Guardar en Quarantine Vault temporalmente
  async uploadToQuarantine(filename: string, buffer: Buffer, mime: string, tenantSlug = 'default') {
    const safeName = this.sanitizeFilename(filename);
    const key = `${tenantSlug}/raw/${Date.now()}-${safeName}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.quarantineBucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
      }),
    );
    return key;
  }

  // 3. Promover a Processed Documents una vez validado
  async promoteToProcessed(filename: string, buffer: Buffer, mime: string, hash: string, tenantSlug = 'default') {
    const safeName = this.sanitizeFilename(filename);
    const key = `${tenantSlug}/${new Date().getFullYear()}/${hash.substring(0, 8)}-${safeName}`;
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.processedBucket,
        Key: key,
        Body: buffer,
        ContentType: mime,
        Metadata: {
          'sha256-checksum': hash,
        },
      }),
    );
    return key;
  }

  // 3b. Limpiar objeto temporal de cuarentena tras promoverlo (o si falla validación)
  async removeFromQuarantine(quarantineKey: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.quarantineBucket,
        Key: quarantineKey,
      }),
    );
  }

  // 4. Registrar en Audit Logs (Inmutable)
  async recordAuditLog(documentKey: string, hash: string, size: number, tenantSlug = 'default') {
    const auditRecord = {
      timestamp: new Date().toISOString(),
      tenantSlug,
      documentKey,
      hash,
      sizeBytes: size,
      verifiedBy: 'doc-processor-service',
    };

    const key = `${tenantSlug}/audits/${Date.now()}-${hash.substring(0, 8)}.json`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.auditBucket,
        Key: key,
        Body: JSON.stringify(auditRecord, null, 2),
        ContentType: 'application/json',
      }),
    );

    return key;
  }
}