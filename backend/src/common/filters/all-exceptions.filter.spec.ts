import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';

const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockHost = (req: any, res: any): ArgumentsHost => ({
    switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
    }),
    getType: () => 'http',
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({} as any),
    switchToWs: () => ({} as any),
} as unknown as ArgumentsHost);

describe('AllExceptionsFilter', () => {
    it('handles Multer LIMIT_FILE_SIZE with business code', () => {
        const filter = new AllExceptionsFilter();
        const res = mockResponse();
        const req = { method: 'POST', url: '/upload' };
        const host = mockHost(req, res);
        const err = new MulterError('LIMIT_FILE_SIZE');

        filter.catch(err, host);

        expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(res.json).toHaveBeenCalled();
        const payload = res.json.mock.calls[0][0];
        expect(payload.code).toBe('UPLOAD_TOO_LARGE');
    });

    it('handles HttpException with provided code', () => {
        const filter = new AllExceptionsFilter();
        const res = mockResponse();
        const req = { method: 'GET', url: '/records' };
        const host = mockHost(req, res);
        const ex = new HttpException({ message: 'forbidden', code: 'AUTH_FORBIDDEN' }, HttpStatus.FORBIDDEN);

        filter.catch(ex, host);

        expect(res.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
        const payload = res.json.mock.calls[0][0];
        expect(payload.code).toBe('AUTH_FORBIDDEN');
        expect(payload.message).toBe('forbidden');
    });
});
