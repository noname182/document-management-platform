import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client;
  private quarantineBucket = process.env.MINIO_BUCKET_QUARANTINE || 'quarantine-vault';
  private processedBucket = process.env.MINIO_BUCKET_PROCESSED || 'processed-documents';
  private auditBucket = process.env.MINIO_BUCKET_AUDIT || 'audit-logs';

  onModuleInit() {
    this.s3Client = new S3Client({
      endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || 9000}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio_admin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio_secret_key',
      },
      forcePathStyle: true, // Obligatorio para MinIO
    });
  }

  // 1. Validar Magic Bytes e Integridad SHA-256 usando importación dinámica ESM
  async inspectAndHash(fileBuffer: Buffer) {
    const { fileTypeFromBuffer } = await (eval('import("file-type")') as Promise<typeof import('file-type')>);
    const fileTypeResult = await fileTypeFromBuffer(fileBuffer);

    // Lista de tipos MIME permitidos
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];

    if (!fileTypeResult || !allowedMimeTypes.includes(fileTypeResult.mime)) {
      throw new BadRequestException(
        `Tipo de archivo inválido o manipulado. Detectado: ${fileTypeResult?.mime || 'desconocido'}`
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
  async uploadToQuarantine(filename: string, buffer: Buffer, mime: string) {
    const key = `raw/${Date.now()}-${filename}`;
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
  async promoteToProcessed(filename: string, buffer: Buffer, mime: string, hash: string) {
    const key = `${new Date().getFullYear()}/${hash.substring(0, 8)}-${filename}`;
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

  // 4. Registrar en Audit Logs (Inmutable)
  async recordAuditLog(documentKey: string, hash: string, size: number) {
    const auditRecord = {
      timestamp: new Date().toISOString(),
      documentKey,
      hash,
      sizeBytes: size,
      verifiedBy: 'doc-processor-service',
    };

    const key = `audits/${Date.now()}-${hash.substring(0, 8)}.json`;

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