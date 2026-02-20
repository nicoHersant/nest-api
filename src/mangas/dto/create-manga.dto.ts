export class CreateMangaDto {
  title: string;
  author: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  volumes: number;
  startYear: number;
  publisher: string;
  synopsis: string;
}
