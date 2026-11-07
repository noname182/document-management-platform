import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
}