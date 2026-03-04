import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import * as fs from 'fs';

jest.mock('fs');

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
    jest.clearAllMocks();
  });

  describe('read', () => {
    it('should read a file and parse its JSON content', () => {
      const mockData = [{ id: 1, title: 'Berserk' }];
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      const result = service.read<typeof mockData>('mangas.json');

      expect(result).toEqual(mockData);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('mangas.json'),
        'utf-8',
      );
    });

    it('should read users.json and return parsed users array', () => {
      const mockUsers = [{ id: '1', email: 'admin@test.com' }];
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockUsers));

      const result = service.read<typeof mockUsers>('users.json');

      expect(result).toEqual(mockUsers);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('users.json'),
        'utf-8',
      );
    });
  });

  describe('write', () => {
    it('should stringify data and write it to the file', () => {
      const mockData = [{ id: 1, title: 'Berserk' }];
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      service.write('mangas.json', mockData);

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('mangas.json'),
        JSON.stringify(mockData, null, 2),
        'utf-8',
      );
    });

    it('should pretty-print JSON with 2-space indentation', () => {
      const data = { key: 'value' };
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      service.write('test.json', data);

      const written = (fs.writeFileSync as jest.Mock).mock.calls[0][1] as string;
      expect(written).toContain('  "key"');
    });
  });
});
