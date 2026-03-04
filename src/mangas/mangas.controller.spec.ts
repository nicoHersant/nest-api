import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MangasController } from './mangas.controller';
import { MangasService } from './mangas.service';
import { MangaStatus } from './dto/create-manga.dto';

describe('MangasController', () => {
  let controller: MangasController;
  let mangasService: jest.Mocked<MangasService>;

  const mockManga = {
    id: 1,
    title: 'Berserk',
    author: 'Kentaro Miura',
    genres: ['Dark Fantasy', 'Action'],
    status: 'ongoing' as const,
    volumes: 41,
    startYear: 1989,
    publisher: 'Hakusensha',
    synopsis: 'A warrior fights demonic forces.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MangasController],
      providers: [
        {
          provide: MangasService,
          useValue: {
            findAll: jest.fn(),
            search: jest.fn(),
            findOne: jest.fn(),
            exists: jest.fn(),
            create: jest.fn(),
            replace: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MangasController>(MangasController);
    mangasService = module.get(MangasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should delegate to mangasService.findAll and return paginated list', () => {
      const mockResult = { data: [mockManga], total: 1, page: 1, limit: 10 };
      mangasService.findAll.mockReturnValue(mockResult);

      const result = controller.findAll({});

      expect(mangasService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockResult);
    });

    it('should forward query params to the service', () => {
      mangasService.findAll.mockReturnValue({ data: [], total: 0, page: 2, limit: 5 });

      controller.findAll({ page: 2, limit: 5, genre: 'action' });

      expect(mangasService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        genre: 'action',
      });
    });
  });

  describe('search', () => {
    it('should call mangasService.search with the trimmed query', () => {
      mangasService.search.mockReturnValue([mockManga]);

      const result = controller.search('  berserk  ');

      expect(mangasService.search).toHaveBeenCalledWith('berserk');
      expect(result).toEqual([mockManga]);
    });

    it('should throw BadRequestException if query is empty string', () => {
      expect(() => controller.search('')).toThrow(BadRequestException);
      expect(mangasService.search).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if query is only whitespace', () => {
      expect(() => controller.search('   ')).toThrow(BadRequestException);
      expect(mangasService.search).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call mangasService.findOne with the numeric id', () => {
      mangasService.findOne.mockReturnValue(mockManga);

      const result = controller.findOne(1);

      expect(mangasService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockManga);
    });
  });

  describe('headOne', () => {
    it('should call mangasService.findOne and send a 200 response with no body', () => {
      mangasService.findOne.mockReturnValue(mockManga);
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      controller.headOne(1, mockRes as any);

      expect(mangasService.findOne).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should call mangasService.create and return the new manga', () => {
      mangasService.create.mockReturnValue(mockManga);

      const createDto = {
        title: 'Berserk',
        author: 'Kentaro Miura',
        genres: ['Dark Fantasy', 'Action'],
        status: MangaStatus.ONGOING,
        volumes: 41,
        startYear: 1989,
        publisher: 'Hakusensha',
        synopsis: 'A warrior fights demonic forces.',
      };

      const result = controller.create(createDto);

      expect(mangasService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockManga);
    });
  });

  describe('replace', () => {
    it('should call mangasService.replace with id and full dto', () => {
      mangasService.replace.mockReturnValue(mockManga);

      const dto = {
        title: 'Berserk',
        author: 'Kentaro Miura',
        genres: ['Dark Fantasy'],
        status: MangaStatus.ONGOING,
        volumes: 41,
        startYear: 1989,
        publisher: 'Hakusensha',
        synopsis: 'A warrior fights demonic forces.',
      };

      const result = controller.replace(1, dto);

      expect(mangasService.replace).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(mockManga);
    });
  });

  describe('update', () => {
    it('should call mangasService.update with id and partial dto', () => {
      mangasService.update.mockReturnValue({ ...mockManga, volumes: 42 });

      const result = controller.update(1, { volumes: 42 });

      expect(mangasService.update).toHaveBeenCalledWith(1, { volumes: 42 });
      expect(result.volumes).toBe(42);
    });
  });

  describe('remove', () => {
    it('should call mangasService.remove with the numeric id', () => {
      mangasService.remove.mockReturnValue(undefined);

      controller.remove(1);

      expect(mangasService.remove).toHaveBeenCalledWith(1);
    });
  });
});
