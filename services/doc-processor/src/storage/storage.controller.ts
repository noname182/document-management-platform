import {
  Controller,
  Post,
  Get,
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
  async processDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }

    // Guardar en cuarentena
    const quarantineKey = await this.storageService.uploadToQuarantine(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    // Validación de bytes reales e integridad criptográfica
    const inspection = await this.storageService.inspectAndHash(file.buffer);

    // Mover a processed-documents con metadata del hash
    const processedKey = await this.storageService.promoteToProcessed(
      file.originalname,
      file.buffer,
      inspection.mime,
      inspection.hash,
    );

    // Generar log inmutable de auditoría
    const auditKey = await this.storageService.recordAuditLog(
      processedKey,
      inspection.hash,
      file.size,
    );

    return {
      status: 'success',
      message: 'Documento verificado, procesado y auditado correctamente',
      data: {
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