import { DynamicModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { UploadsController } from './uploads.controller';
import { UploadsModuleOptions } from './uploads.interface';

@Module({
  imports: [
    MulterModule.register({
      dest: './public/images',
    }),
  ],
})
export class UploadsModule {
  static forRoot(options: UploadsModuleOptions): DynamicModule {
    return {
      module: UploadsModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
      ],
      controllers: [UploadsController],
    };
  }
}
