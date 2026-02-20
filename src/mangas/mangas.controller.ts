import {
  Controller,
  Get,
  Head,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { MangasService } from './mangas.service';
import { QueryMangaDto } from './dto/query-manga.dto';

@Controller('mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  @Get()
  findAll(@Query() query: QueryMangaDto) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 10;

    if (page < 1 || limit < 1 || limit > 50) {
      throw new BadRequestException(
        'page must be >= 1, limit must be between 1 and 50',
      );
    }

    return this.mangasService.findAll({ ...query, page, limit });
  }

  @Get('search')
  search(@Query('q') q: string) {
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('Query param "q" is required and cannot be empty');
    }
    return this.mangasService.search(q.trim());
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mangasService.findOne(id);
  }

  @Head(':id')
  @HttpCode(200)
  headOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    this.mangasService.findOne(id); // lève 404 si absent
    res.status(200).send();
  }
}
