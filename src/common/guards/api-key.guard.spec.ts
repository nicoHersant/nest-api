import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { AuthService, User } from '../../auth/auth.service';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: jest.Mocked<Reflector>;
  let authService: jest.Mocked<AuthService>;

  const mockUser: User = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'user',
    apiKey: 'valid-api-key',
    createdAt: '2024-01-01T00:00:00.000Z',
  };

  const buildContext = (
    headers: Record<string, string> = {},
  ): ExecutionContext => {
    const request = { headers } as any;
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
      _request: request,
    } as any;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
        {
          provide: AuthService,
          useValue: { findByApiKey: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    reflector = module.get(Reflector);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow public routes without checking the API key', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = buildContext();

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(authService.findByApiKey).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when the X-API-Key header is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = buildContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when the API key is not recognised', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.findByApiKey.mockReturnValue(undefined);
    const context = buildContext({ 'x-api-key': 'unknown-key' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should return true and attach req.user when the API key is valid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.findByApiKey.mockReturnValue(mockUser);

    const request: Record<string, unknown> = {
      headers: { 'x-api-key': 'valid-api-key' },
    };
    const context: ExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as any;

    const result = guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user).toEqual(mockUser);
    expect(authService.findByApiKey).toHaveBeenCalledWith('valid-api-key');
  });

  it('should call authService.findByApiKey with the value from the header', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.findByApiKey.mockReturnValue(mockUser);

    const request = { headers: { 'x-api-key': 'my-secret-key' } } as any;
    const context: ExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    } as any;

    guard.canActivate(context);

    expect(authService.findByApiKey).toHaveBeenCalledWith('my-secret-key');
  });
});
