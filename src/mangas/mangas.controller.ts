import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Head,
  Param,
  Query,
  Body,
  ParseIntPipe,
  BadRequestException,
  HttpCode,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { MangasService } from './mangas.service';
import { QueryMangaDto } from './dto/query-manga.dto';
import { CreateMangaDto } from './dto/create-manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { AdminOnly } from '../common/decorators/admin.decorator';

@Controller('mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  // ─── Lecture (user + admin) ──────────────────────────────────────────────

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

  // ─── Écriture (admin uniquement) ─────────────────────────────────────────

  @AdminOnly()
  @Post()
  @HttpCode(201)
  create(@Body() body: CreateMangaDto) {
    return this.mangasService.create(body);
  }

  @AdminOnly()
  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: CreateMangaDto) {
    return this.mangasService.replace(id, body);
  }

  @AdminOnly()
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMangaDto) {
    return this.mangasService.update(id, body);
  }

  @AdminOnly()
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.mangasService.remove(id);
  }
}
