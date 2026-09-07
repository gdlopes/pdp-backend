import { Test, TestingModule } from '@nestjs/testing';
import { TokenIssuer } from '../token-issuer.service';
import { LogoutService } from './logout.service';

describe('LogoutService', () => {
  let service: LogoutService;
  const tokenIssuer = { revokeFamilyByRaw: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        { provide: TokenIssuer, useValue: tokenIssuer },
      ],
    }).compile();

    service = module.get(LogoutService);
  });

  it('revokes the family when a refresh cookie is present', async () => {
    await service.execute('refresh-raw');

    expect(tokenIssuer.revokeFamilyByRaw).toHaveBeenCalledWith('refresh-raw');
  });

  it('succeeds without creating a session when the cookie is absent', async () => {
    await service.execute(undefined);

    expect(tokenIssuer.revokeFamilyByRaw).not.toHaveBeenCalled();
  });
});
