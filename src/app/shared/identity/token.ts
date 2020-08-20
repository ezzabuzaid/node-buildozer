import jwt = require('jsonwebtoken');
// import stage from '../../core/helpers/stage';
import { PrimaryKey } from '@lib/mongoose';
import { Roles } from '@shared/identity';
import { envirnoment } from '@environment/env';

export interface IClaim {
    id: PrimaryKey;
    readonly iat?: number;
    readonly exp?: number;
}
export interface ITokenClaim extends IClaim {
    role?: Roles;
    verified?: boolean;
    name: string;
}

export interface IRefreshTokenClaim extends IClaim { }

class TokenService {
    /**
     *
     * @param token
     * @returns {Promise<T extends ITokenClaim>}
     */
    public decodeToken<T extends IClaim = ITokenClaim>(token: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            jwt.verify(token, this.secretKey, (error, decodedToken) => {
                if (error) {
                    reject(error);
                }
                resolve(decodedToken as unknown as T);
            });
        });
    }

    /**
     *
     * @param data token payload
     * @returns the encrypted token
     */
    public generateToken<T extends IClaim>(data: T, options?: jwt.SignOptions) {
        return jwt.sign(data, this.secretKey, options);
    }

    public isTokenExpired<T extends ITokenClaim>(token: T) {
        return Date.now() >= token.exp * 1000;
    }

    private get secretKey() {
        return envirnoment.testing
            ? 'fuckSecretForTestOnly'
            : process.env.JWT_SECRET_KEY;
        // FIXME idk what the issue with this when it comes to test
    }
}

export const tokenService = new TokenService();
