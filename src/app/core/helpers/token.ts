import jwt = require('jsonwebtoken');
import { ERoles } from '@api/users';

export interface ITokenClaim {
    role?: ERoles;
    id: string;
    readonly iat?: number;
    readonly exp?: number;
}

class TokenService {

    /**
     *
     * @param token
     * @returns decoation of the token
     */
    public decodeToken<T = ITokenClaim>(token: string) {
        return new Promise<T>((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decodedToken) {
                if (err) { throw err; }
                resolve(decodedToken as unknown as T);
            });
        });
    }

    /**
     *
     * @param data token payload
     * @returns the encrypted token
     */
    public generateToken(data: ITokenClaim, options?: jwt.SignOptions) {
        return jwt.sign(data, process.env.JWT_SECRET_KEY, options);
    }

    public isTokenExpired(token: ITokenClaim) {
        return Date.now() <= token.exp * 1000;
    }
}

export const tokenService = new TokenService();
