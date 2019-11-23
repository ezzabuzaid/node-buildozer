import jwt = require('jsonwebtoken');
import { ERoles } from '@api/users';

export interface ITokenClaim {
    role: ERoles;
    id: string;
}

class TokenService {

    /**
     *
     * @param token
     * @returns decoation of the token
     */
    public decodeToken<T>(token: string) {
        return new Promise<T>((resolve, reject) => {
            jwt.verify(token, process.env.JWT_SECRET_KEY, function(err, decodedToken) {
                if (err) { reject(err); }
                resolve(decodedToken as unknown as T);
            });
        });
    }

    /**
     *
     * @param data token payload
     * @returns the encrypted token
     */
    public generateToken(data: ITokenClaim) {
        return jwt.sign(data, process.env.JWT_SECRET_KEY);
    }
}

export const tokenService = new TokenService();
