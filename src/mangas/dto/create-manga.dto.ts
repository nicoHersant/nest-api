import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MangaStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
}

export class CreateMangaDto {
  @ApiProperty({ example: 'Berserk', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Kentaro Miura', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  author: string;

  @ApiProperty({ example: ['Dark Fantasy', 'Action'], type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  genres: string[];

  @ApiProperty({ enum: MangaStatus, example: MangaStatus.ONGOING })
  @IsEnum(MangaStatus, {
    message: 'status must be one of: ongoing, completed, hiatus',
  })
  status: MangaStatus;

  @ApiProperty({ example: 41, minimum: 1 })
  @IsInt()
  @Min(1)
  volumes: number;

  @ApiProperty({ example: 1989, minimum: 1900 })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  startYear: number;

  @ApiProperty({ example: 'Hakusensha', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  publisher: string;

  @ApiProperty({ example: 'Un guerrier au destin tragique combat des forces démoniaques.', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  synopsis: string;
}
