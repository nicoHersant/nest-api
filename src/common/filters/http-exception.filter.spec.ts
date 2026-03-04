import { ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string };
  let mockHost: jest.Mocked<ArgumentsHost>;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = { url: '/api/test' };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  describe('HttpException handling', () => {
    it('should respond with the correct status code for a 404 error', () => {
      const exception = new HttpException('Manga not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should map the 404 status to the "Not Found" error label', () => {
      const exception = new HttpException('Manga not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error).toBe('Not Found');
    });

    it('should include the original message in the response', () => {
      const exception = new HttpException('Manga not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe('Manga not found');
    });

    it('should include the request path in the response', () => {
      const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.path).toBe('/api/test');
    });

    it('should include a valid ISO timestamp in the response', () => {
      const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp as string).getTime()).not.toBeNaN();
    });

    it('should handle validation errors with an array of messages', () => {
      const exception = new HttpException(
        {
          message: ['email must be a valid email', 'email should not be empty'],
          statusCode: 400,
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.statusCode).toBe(400);
      expect(body.message).toEqual([
        'email must be a valid email',
        'email should not be empty',
      ]);
      expect(body.error).toBe('Bad Request');
    });

    it('should handle a 401 Unauthorized exception correctly', () => {
      const exception = new HttpException(
        'Missing API key',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.statusCode).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('should handle a 403 Forbidden exception correctly', () => {
      const exception = new HttpException(
        'Admin only',
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.statusCode).toBe(403);
      expect(body.error).toBe('Forbidden');
    });

    it('should handle a 409 Conflict exception correctly', () => {
      const exception = new HttpException(
        'Email already registered',
        HttpStatus.CONFLICT,
      );

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.statusCode).toBe(409);
      expect(body.error).toBe('Conflict');
    });
  });

  describe('non-HTTP exception handling', () => {
    it('should respond with status 500 for a generic JavaScript Error', () => {
      const exception = new Error('Something went wrong internally');

      filter.catch(exception, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should return a generic message and not expose internal error details', () => {
      const exception = new Error('DB connection lost — secret info');

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.message).toBe(
        'An unexpected error occurred. Please contact support.',
      );
      expect(JSON.stringify(body)).not.toContain('DB connection lost');
    });

    it('should label the error as "Internal Server Error"', () => {
      const exception = new Error('crash');

      filter.catch(exception, mockHost);

      const body = mockResponse.json.mock.calls[0][0];
      expect(body.error).toBe('Internal Server Error');
      expect(body.statusCode).toBe(500);
    });
  });
});
