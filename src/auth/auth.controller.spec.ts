import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService, User } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'user',
    apiKey: 'test-api-key',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const mockRequest = (user: User) => ({ user } as any);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            getMe: jest.fn(),
            regenerateKey: jest.fn(),
            deleteAccount: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call authService.register with the provided email', () => {
      authService.register.mockReturnValue({ apiKey: 'new-generated-key' });

      const result = controller.register({ email: 'test@test.com' });

      expect(authService.register).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual({ apiKey: 'new-generated-key' });
    });
  });

  describe('getMe', () => {
    it('should call authService.getMe with the apiKey from req.user', () => {
      authService.getMe.mockReturnValue(mockUser);

      const result = controller.getMe(mockRequest(mockUser));

      expect(authService.getMe).toHaveBeenCalledWith('test-api-key');
      expect(result).toEqual(mockUser);
    });
  });

  describe('regenerateKey', () => {
    it('should call authService.regenerateKey with the apiKey from req.user', () => {
      authService.regenerateKey.mockReturnValue({ apiKey: 'new-key' });

      const result = controller.regenerateKey(mockRequest(mockUser));

      expect(authService.regenerateKey).toHaveBeenCalledWith('test-api-key');
      expect(result).toEqual({ apiKey: 'new-key' });
    });
  });

  describe('deleteAccount', () => {
    it('should call authService.deleteAccount with the apiKey from req.user', () => {
      authService.deleteAccount.mockReturnValue(undefined);

      controller.deleteAccount(mockRequest(mockUser));

      expect(authService.deleteAccount).toHaveBeenCalledWith('test-api-key');
    });
  });
});
