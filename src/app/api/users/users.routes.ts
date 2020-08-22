import { Responses, SuccessResponse } from '@core/response';
import { FromBody, FromQuery, HttpGet, HttpPost, Route, RemoveMiddleware, FromParams } from '@lib/restful';
import { CrudRouter, Pagination } from '@shared/crud';
import { EmailService } from '@shared/email';
import { identity, AllowAnonymous } from '@shared/identity';
import { IsOptional, IsString, IsEmail } from 'class-validator';
import { UsersSchema } from './users.model';
import { UserService } from './users.service';
import redis from 'redis';
import { Constants } from '@core/constants';
import Cache from 'file-system-cache';
import { ProfilesSchema } from './profile.model';

class SearchForUserDto extends Pagination {
    @IsOptional()
    @IsString()
    public username: string = null;
}

class CreateUserDto {
    @IsString()
    public username: string = null;

    @IsString()
    public password: string = null;

    @IsEmail()
    public email: string = null;

    @IsString()
    public mobile: string = null;

    @IsOptional()
    public profile: ProfilesSchema = null;
}

@Route(Constants.Endpoints.USERS, {
    middleware: [identity.Authorize()],
})
export class UsersRouter extends CrudRouter<UsersSchema, UserService> {
    private redisClient: redis.RedisClient /*= redis.createClient(6379)**/;
    private fileSystemCache = Cache({ basePath: './.cache', });
    constructor() {
        super(UserService);
    }

    cache(key: string, value: any) {
        return new Promise((resolve, reject) => {
            return this.redisClient.set(UsersRouter.name + key, JSON.stringify(value), (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(true);
                }
            });
        });
    }

    getCache(key) {
        return new Promise((resolve, reject) => {
            return this.redisClient.get(UsersRouter.name + key, (error, data) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(data));
                }
            });
        });
    }

    fsCache(key: string, value: any) {
        return this.fileSystemCache.set(key, JSON.stringify(value));
    }

    async fsGetCache(key) {
        const data = await this.fileSystemCache.get(key);
        try {
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    @HttpGet()
    async getAll(@FromQuery(Pagination) { page, size, ...sort }: Pagination) {
        // const cachedData = await this.fsGetCache('getAll');
        // if (cachedData) {
        //     return cachedData;
        // }
        const { data } = (await this.service.all({}, { page, size, sort }));
        await this.fsCache('getAll', data);
        return data;
    }

    @HttpPost()
    @AllowAnonymous()
    public async create(@FromBody(CreateUserDto) body: CreateUserDto) {
        const { data } = await this.service.create(body as any);
        EmailService.sendVerificationEmail(body.email, data.id);
        return new SuccessResponse(data, 'An e-mail has been sent to your email inbox in order to verify the account');
    }

    @HttpGet(Constants.Endpoints.SEARCH)
    public async searchForUsers(@FromQuery(SearchForUserDto) query: SearchForUserDto) {
        const users = await this.service.searchForUser(query.username, query);
        return new Responses.Ok(users.data);
    }

    @HttpGet('username')
    public async isUsernameExist(@FromQuery(SearchForUserDto) query: SearchForUserDto) {
        const { username } = query;
        const result = await this.service.one({ username });
        return new Responses.Ok(result.data);
    }

    @HttpGet('room/:id')
    public async getAllUsersExceptRoomUsers(@FromParams('id') room) {
        const result = await this.service.getAllUsersExceptRoomUsers(room);
        return new Responses.Ok(result.data);
    }

}
