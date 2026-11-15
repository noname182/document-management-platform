import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import 'multer';
import { StorageService } from './storage.service';

@Controller('documents')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('process')
  @UseInterceptors(FileInterceptor('file'))
  async processDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('tenantSlug') rawTenantSlug?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    // Sanitiza el slug del tenant (ej. "micro-negocio-de-tecnologia") o usa "default"
    const tenantSlug =
      rawTenantSlug
        ?.trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '') || 'default';

    // 1. Guardar en cuarentena bajo la carpeta del tenant
    const quarantineKey = await this.storageService.uploadToQuarantine(
      file.originalname,
      file.buffer,
      file.mimetype,
      tenantSlug,
    );

    // 2. Validación de bytes reales e integridad criptográfica
    const inspection = await this.storageService.inspectAndHash(file.buffer);

    // 3. Mover a processed-documents bajo <tenantSlug>/<año>/...
    const processedKey = await this.storageService.promoteToProcessed(
      file.originalname,
      file.buffer,
      inspection.mime,
      inspection.hash,
      tenantSlug,
    );

    // 4. Limpiar archivo temporal de cuarentena tras promoverlo
    const storageWithCleanup = this.storageService as unknown as {
      removeFromQuarantine?: (key: string) => Promise<void>;
    };
    if (typeof storageWithCleanup.removeFromQuarantine === 'function') {
      await storageWithCleanup.removeFromQuarantine(quarantineKey);
    }

    // 5. Generar log inmutable de auditoría bajo el tenant
    const auditKey = await this.storageService.recordAuditLog(
      processedKey,
      inspection.hash,
      file.size,
      tenantSlug,
    );

    return {
      status: 'success',
      message: 'Documento verificado, procesado y auditado correctamente',
      data: {
        tenantSlug,
        hashSha256: inspection.hash,
        mimeType: inspection.mime,
        quarantineLocation: quarantineKey,
        storageLocation: processedKey,
        auditLogRecord: auditKey,
      },
    };
  }

  @Get('download')
  async downloadDocument(
    @Query('key') key: string,
    @Query('bucket') bucket: string | undefined,
    @Query('filename') filename: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!key) {
      throw new BadRequestException('El parámetro "key" es obligatorio');
    }

    const fileData = await this.storageService.getFileStream(key, bucket);
    const safeFilename = (filename || key.split('/').pop() || 'documento').replace(/"/g, '');

    res.set({
      'Content-Type': fileData.contentType,
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      ...(fileData.contentLength ? { 'Content-Length': String(fileData.contentLength) } : {}),
    });

    return new StreamableFile(fileData.stream);
  }
}