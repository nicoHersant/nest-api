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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MangasService } from './mangas.service';
import { QueryMangaDto } from './dto/query-manga.dto';
import { CreateMangaDto } from './dto/create-manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';
import { AdminOnly } from '../common/decorators/admin.decorator';

@ApiTags('Mangas')
@ApiSecurity('api-key')
@Controller('mangas')
export class MangasController {
  constructor(private readonly mangasService: MangasService) {}

  // ─── Lecture (user + admin) ──────────────────────────────────────────────

  @ApiOperation({ summary: 'Liste paginée des mangas', description: 'Filtrables par genre et status. 10 résultats par page par défaut.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'genre', required: false, type: String, example: 'Action' })
  @ApiQuery({ name: 'status', required: false, enum: ['ongoing', 'completed', 'hiatus'] })
  @ApiResponse({ status: 200, description: 'Liste retournée avec pagination' })
  @ApiResponse({ status: 400, description: 'Paramètres invalides' })
  @ApiResponse({ status: 401, description: 'Header X-API-Key absent' })
  @ApiResponse({ status: 429, description: 'Rate limit dépassé' })
  @Get()
  findAll(@Query() query: QueryMangaDto) {
    return this.mangasService.findAll(query);
  }

  @ApiOperation({ summary: 'Recherche full-text', description: "Recherche sur titre, auteur et synopsis." })
  @ApiQuery({ name: 'q', required: true, type: String, example: 'naruto' })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  @ApiResponse({ status: 400, description: 'Paramètre q absent ou vide' })
  @Get('search')
  search(@Query('q') q: string) {
    if (!q || q.trim().length === 0) {
      throw new BadRequestException('Query param "q" is required and cannot be empty');
    }
    return this.mangasService.search(q.trim());
  }

  @ApiOperation({ summary: 'Détail d\'un manga par id' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Manga trouvé' })
  @ApiResponse({ status: 404, description: 'Manga introuvable' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mangasService.findOne(id);
  }

  @ApiOperation({ summary: 'Vérifier l\'existence d\'un manga (sans body)' })
  @ApiParam({ name: 'id', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Manga existant' })
  @ApiResponse({ status: 404, description: 'Manga introuvable' })
  @Head(':id')
  @HttpCode(200)
  headOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    this.mangasService.findOne(id);
    res.status(200).send();
  }

  // ─── Écriture (admin uniquement) ─────────────────────────────────────────

  @ApiOperation({ summary: '[Admin] Créer un manga' })
  @ApiResponse({ status: 201, description: 'Manga créé' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux administrateurs' })
  @ApiResponse({ status: 409, description: 'Titre déjà existant' })
  @AdminOnly()
  @Post()
  @HttpCode(201)
  create(@Body() body: CreateMangaDto) {
    return this.mangasService.create(body);
  }

  @ApiOperation({ summary: '[Admin] Remplacer un manga — PUT = remplacement complet de la ressource' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Manga remplacé' })
  @ApiResponse({ status: 404, description: 'Manga introuvable' })
  @ApiResponse({ status: 409, description: 'Titre en conflit' })
  @AdminOnly()
  @Put(':id')
  replace(@Param('id', ParseIntPipe) id: number, @Body() body: CreateMangaDto) {
    return this.mangasService.replace(id, body);
  }

  @ApiOperation({ summary: '[Admin] Modifier partiellement un manga — PATCH = update partiel' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Manga mis à jour' })
  @ApiResponse({ status: 404, description: 'Manga introuvable' })
  @AdminOnly()
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMangaDto) {
    return this.mangasService.update(id, body);
  }

  @ApiOperation({ summary: '[Admin] Supprimer un manga' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Manga supprimé' })
  @ApiResponse({ status: 404, description: 'Manga introuvable' })
  @AdminOnly()
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    this.mangasService.remove(id);
  }
}
