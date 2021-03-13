import {
  Controller,
  Get,
  Inject,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import * as AWS from 'aws-sdk';
import { diskStorage } from 'multer';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { UploadsModuleOptions } from './uploads.interface';

@Controller('uploads')
export class UploadsController {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: UploadsModuleOptions,
  ) {}

  @Get()
  getOptions() {
    console.log(this.options);
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      // form-data 에서 name이 'file'인 것을 intercept
      storage: diskStorage({
        destination: './public/images',
        filename: (req, file, callback) => {
          callback(null, `${new Date().getTime()}_${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      originalname: file.originalname,
      filename: file.filename,
      url: `http://localhost:4000/images/${file.filename}`,
    };
  }
}
