import { PartialType } from '@nestjs/mapped-types';
import { CreateMangaDto } from './create-manga.dto';

/**
 * Tous les champs de CreateMangaDto deviennent optionnels.
 * Les validateurs sont conservés lorsqu'un champ est fourni.
 */
export class UpdateMangaDto extends PartialType(CreateMangaDto) {}
