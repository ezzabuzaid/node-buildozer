import { Constants } from '@core/constants';
import { Responses } from '@core/response';
import { FromBody, FromQuery, HttpGet, HttpPost, Route } from '@lib/restful';
import { FromHeaders } from '@lib/restful/headers.decorator';
import { NameValidator } from '@shared/common';
import { CrudRouter, Pagination } from '@shared/crud';
import { identity, tokenService } from '@shared/identity';
import { Request } from 'express';
import { FoldersSchema } from '..';
import sharedFolderService from '../shared-folder/shared-folder.service';
import { FoldersService } from './folders.service';

@Route(Constants.Endpoints.FOLDERS, {
    middleware: [identity.Authorize()],
})
export class FoldersRoutes extends CrudRouter<FoldersSchema> {

    constructor() {
        super(FoldersService);
    }

    @HttpGet()
    async getAll(@FromQuery(Pagination) pagination: Pagination) {
        const { data } = await this.service.all({}, pagination);
        return data;
    }

    @HttpGet('user/shared')
    public async getUserSharedolders(@FromHeaders('authorization') authorization: string) {
        const { id } = await tokenService.decodeToken(authorization);
        const folders = await sharedFolderService.getUserFolders(id, true);
        return new Responses.Ok(folders.data);
    }

    @HttpGet('user')
    public async getUserFolders(@FromHeaders('authorization') authorization: string) {
        const { id } = await tokenService.decodeToken(authorization);
        const folders = await sharedFolderService.getUserFolders(id, false);
        return new Responses.Ok(folders.data);
    }

    @HttpPost('/')
    public async createFolder(
        @FromBody(NameValidator) body: NameValidator,
        @FromHeaders('authorization') authorization: string
    ) {
        const { id } = await tokenService.decodeToken(authorization);
        const result = await this.service.create({ name: body.name });
        // TODO: it's very important to find a way to pass the current user to service
        await sharedFolderService.create({
            folder: result.data.id,
            shared: false,
            user: id
        });
        return new Responses.Created(result.data);
    }

    @HttpGet('tags')
    getTags() {
        class Tag {
            static count = -1;
            id = ++Tag.count;
            constructor(
                public color: string = null,
            ) { }
        }
        const tags = [
            new Tag('black'),
            new Tag('blue'),
            new Tag('grey'),
            new Tag('purple'),
            new Tag('red'),
            new Tag('green'),
            new Tag('yellow'),
            new Tag('pink'),
            new Tag('aqua'),
            new Tag('#6c757c'),
        ];
        return new Responses.Ok(tags);
    }
}
