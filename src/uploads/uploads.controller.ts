import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('uploads')
export class UploadsController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // form-data 에서 name이 'file'인 것을 intercept
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }
}
