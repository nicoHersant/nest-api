import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService, User } from './auth.service';
import { StorageService } from '../storage/storage.service';

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@mangaapi.dev',
    role: 'admin',
    apiKey: 'admin-key-123',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user-2',
    email: 'user@test.com',
    role: 'user',
    apiKey: 'user-key-456',
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('AuthService', () => {
  let service: AuthService;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: StorageService,
          useValue: {
            read: jest.fn(),
            write: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    storageService = module.get(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create a new user and return an apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);
      storageService.write.mockImplementation(() => {});

      const result = service.register('newuser@test.com');

      expect(result).toHaveProperty('apiKey');
      expect(typeof result.apiKey).toBe('string');
      expect(result.apiKey.length).toBeGreaterThan(0);
    });

    it('should persist the new user to storage', () => {
      storageService.read.mockReturnValue([...mockUsers]);
      storageService.write.mockImplementation(() => {});

      service.register('newuser@test.com');

      expect(storageService.write).toHaveBeenCalledWith(
        'users.json',
        expect.arrayContaining([
          expect.objectContaining({
            email: 'newuser@test.com',
            role: 'user',
          }),
        ]),
      );
    });

    it('should assign role "user" to new registrations', () => {
      storageService.read.mockReturnValue([]);
      storageService.write.mockImplementation(() => {});

      service.register('first@test.com');

      const written: User[] = storageService.write.mock.calls[0][1] as User[];
      expect(written[0].role).toBe('user');
    });

    it('should throw ConflictException if email already exists', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      expect(() => service.register('admin@mangaapi.dev')).toThrow(
        ConflictException,
      );
    });

    it('should not write to storage on conflict', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      expect(() => service.register('admin@mangaapi.dev')).toThrow();
      expect(storageService.write).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user data for a valid apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      const result = service.getMe('admin-key-123');

      expect(result.email).toBe('admin@mangaapi.dev');
      expect(result.role).toBe('admin');
    });

    it('should throw NotFoundException for an unknown apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      expect(() => service.getMe('unknown-key')).toThrow(NotFoundException);
    });
  });

  describe('regenerateKey', () => {
    it('should return a new apiKey different from the old one', () => {
      storageService.read.mockReturnValue([...mockUsers]);
      storageService.write.mockImplementation(() => {});

      const result = service.regenerateKey('user-key-456');

      expect(result).toHaveProperty('apiKey');
      expect(result.apiKey).not.toBe('user-key-456');
    });

    it('should persist the updated user with the new key', () => {
      storageService.read.mockReturnValue([...mockUsers]);
      storageService.write.mockImplementation(() => {});

      const { apiKey: newKey } = service.regenerateKey('user-key-456');

      expect(storageService.write).toHaveBeenCalledWith(
        'users.json',
        expect.arrayContaining([
          expect.objectContaining({ apiKey: newKey }),
        ]),
      );
    });

    it('should throw NotFoundException for an unknown apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      expect(() => service.regenerateKey('unknown-key')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAccount', () => {
    it('should remove the user from storage', () => {
      storageService.read.mockReturnValue([...mockUsers]);
      storageService.write.mockImplementation(() => {});

      service.deleteAccount('user-key-456');

      expect(storageService.write).toHaveBeenCalledWith(
        'users.json',
        expect.not.arrayContaining([
          expect.objectContaining({ apiKey: 'user-key-456' }),
        ]),
      );
    });

    it('should keep the other users after deletion', () => {
      storageService.read.mockReturnValue([...mockUsers]);
      storageService.write.mockImplementation(() => {});

      service.deleteAccount('user-key-456');

      const written: User[] = storageService.write.mock.calls[0][1] as User[];
      expect(written).toHaveLength(mockUsers.length - 1);
      expect(written[0].email).toBe('admin@mangaapi.dev');
    });

    it('should throw NotFoundException for an unknown apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      expect(() => service.deleteAccount('unknown-key')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByApiKey', () => {
    it('should return the user for a valid apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      const result = service.findByApiKey('admin-key-123');

      expect(result).toBeDefined();
      expect(result?.email).toBe('admin@mangaapi.dev');
    });

    it('should return undefined for an unknown apiKey', () => {
      storageService.read.mockReturnValue([...mockUsers]);

      const result = service.findByApiKey('unknown-key');

      expect(result).toBeUndefined();
    });
  });
});
