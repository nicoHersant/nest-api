import { PartialType } from '@nestjs/swagger';
import { CreateMangaDto } from './create-manga.dto';

/**
 * Tous les champs de CreateMangaDto deviennent optionnels.
 * Les validateurs sont conservés lorsqu'un champ est fourni.
 * PartialType vient de @nestjs/swagger (et non @nestjs/mapped-types) pour
 * que les métadonnées @ApiProperty soient elles aussi héritées.
 */
export class UpdateMangaDto extends PartialType(CreateMangaDto) {}
