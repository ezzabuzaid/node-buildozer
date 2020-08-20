import { Singelton } from '@lib/locator';
import { PrimaryKey } from '@lib/mongoose';
import { IRefreshTokenClaim, tokenService } from '@shared/identity';

@Singelton()
export class PortalHelper {

    public generateRefreshToken(id: PrimaryKey) {
        return tokenService.generateToken<IRefreshTokenClaim>({ id }, { expiresIn: '12h' });
    }

    public generateToken(id: PrimaryKey, role: string, verified: boolean, name: string) {
        return tokenService.generateToken({ id, role, verified, name }, { expiresIn: '6h' });
    }

    public generatePinCode(length = 6) {
        const digits = '0123456789';
        return Array.from({ length }).reduce((pin) => pin + digits[Math.floor(Math.random() * 10)], '') as string;
    }

}
