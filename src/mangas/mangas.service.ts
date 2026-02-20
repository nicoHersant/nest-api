import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { QueryMangaDto } from './dto/query-manga.dto';

export interface Manga {
  id: number;
  title: string;
  author: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  volumes: number;
  startYear: number;
  publisher: string;
  synopsis: string;
}

@Injectable()
export class MangasService {
  constructor(private readonly storage: StorageService) {}

  findAll(query: QueryMangaDto): { data: Manga[]; total: number; page: number; limit: number } {
    let mangas = this.storage.read<Manga[]>('mangas.json');

    if (query.genre) {
      mangas = mangas.filter((m) =>
        m.genres.some((g) => g.toLowerCase().includes(query.genre!.toLowerCase())),
      );
    }

    if (query.status) {
      mangas = mangas.filter((m) => m.status === query.status);
    }

    const total = mangas.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const start = (page - 1) * limit;

    return {
      data: mangas.slice(start, start + limit),
      total,
      page,
      limit,
    };
  }

  search(q: string): Manga[] {
    const mangas = this.storage.read<Manga[]>('mangas.json');
    const term = q.toLowerCase();
    return mangas.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.author.toLowerCase().includes(term) ||
        m.synopsis.toLowerCase().includes(term),
    );
  }

  findOne(id: number): Manga {
    const mangas = this.storage.read<Manga[]>('mangas.json');
    const manga = mangas.find((m) => m.id === id);
    if (!manga) {
      throw new NotFoundException(`Manga with id ${id} not found`);
    }
    return manga;
  }

  exists(id: number): boolean {
    const mangas = this.storage.read<Manga[]>('mangas.json');
    return mangas.some((m) => m.id === id);
  }
}
