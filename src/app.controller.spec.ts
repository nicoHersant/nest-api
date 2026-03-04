import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return status ok and version 1.0.0', () => {
      const result = controller.healthCheck();
      expect(result).toEqual({ status: 'ok', version: '1.0.0' });
    });

    it('should return an object with status string property', () => {
      const result = controller.healthCheck();
      expect(typeof result.status).toBe('string');
      expect(typeof result.version).toBe('string');
    });
  });

  describe('demoError', () => {
    it('should throw an Error', () => {
      expect(() => controller.demoError()).toThrow(Error);
    });

    it('should throw with a message mentioning simulated error', () => {
      expect(() => controller.demoError()).toThrow('Simulated internal error');
    });
  });
});
