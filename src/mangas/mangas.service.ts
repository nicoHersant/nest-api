import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { QueryMangaDto } from './dto/query-manga.dto';
import { CreateMangaDto } from './dto/create-manga.dto';
import { UpdateMangaDto } from './dto/update-manga.dto';

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
    const page = query.page ?? 1;    // défaut : page 1
    const limit = query.limit ?? 10; // défaut : 10 résultats
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

  create(dto: CreateMangaDto): Manga {
    const mangas = this.storage.read<Manga[]>('mangas.json');

    if (mangas.some((m) => m.title.toLowerCase() === dto.title.toLowerCase())) {
      throw new ConflictException(`A manga titled "${dto.title}" already exists`);
    }

    const nextId = mangas.length > 0 ? Math.max(...mangas.map((m) => m.id)) + 1 : 1;
    const newManga: Manga = { id: nextId, ...dto };

    this.storage.write('mangas.json', [...mangas, newManga]);
    return newManga;
  }

  replace(id: number, dto: CreateMangaDto): Manga {
    const mangas = this.storage.read<Manga[]>('mangas.json');
    const index = mangas.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new NotFoundException(`Manga with id ${id} not found`);
    }

    const conflict = mangas.find(
      (m) => m.title.toLowerCase() === dto.title.toLowerCase() && m.id !== id,
    );
    if (conflict) {
      throw new ConflictException(`A manga titled "${dto.title}" already exists`);
    }

    const updated: Manga = { id, ...dto };
    mangas[index] = updated;
    this.storage.write('mangas.json', mangas);
    return updated;
  }

  update(id: number, dto: UpdateMangaDto): Manga {
    const mangas = this.storage.read<Manga[]>('mangas.json');
    const index = mangas.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new NotFoundException(`Manga with id ${id} not found`);
    }

    if (dto.title) {
      const conflict = mangas.find(
        (m) => m.title.toLowerCase() === dto.title!.toLowerCase() && m.id !== id,
      );
      if (conflict) {
        throw new ConflictException(`A manga titled "${dto.title}" already exists`);
      }
    }

    const updated: Manga = { ...mangas[index], ...dto };
    mangas[index] = updated;
    this.storage.write('mangas.json', mangas);
    return updated;
  }

  remove(id: number): void {
    const mangas = this.storage.read<Manga[]>('mangas.json');
    const index = mangas.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new NotFoundException(`Manga with id ${id} not found`);
    }
    mangas.splice(index, 1);
    this.storage.write('mangas.json', mangas);
  }
}
