import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminGuard } from './admin.guard';
import { User } from '../../auth/auth.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let reflector: jest.Mocked<Reflector>;

  const buildContext = (user?: Partial<User>): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow routes not decorated with @AdminOnly()', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = buildContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow an admin user on an @AdminOnly() route', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = buildContext({ role: 'admin' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException for a regular user on an @AdminOnly() route', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = buildContext({ role: 'user' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when req.user is undefined on an @AdminOnly() route', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const context = buildContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should pass the correct metadata keys to the reflector', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = buildContext();

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      'isAdmin',
      expect.any(Array),
    );
  });
});
