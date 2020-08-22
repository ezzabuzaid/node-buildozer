import { UsersSchema, } from './users.model';
import { CrudService, } from '@shared/crud/crud.service';
import { CrudDao, Pagination } from '@shared/crud';
import { Singelton, locate } from '@lib/locator';
import { RoomMembersService } from '@api/chat/members';

@Singelton()
export class UserService extends CrudService<UsersSchema> {
    constructor() {
        super(new CrudDao(UsersSchema), {
            unique: ['username', 'email', 'mobile']
        });
    }

    public searchForUser(username: string, options: Pagination) {
        return this.all({
            username: {
                $regex: username,
                $options: 'i'
            }
        }, options);
    }

    async getAllUsersExceptRoomUsers(id: string) {
        const members = await locate(RoomMembersService).all({ room: id });
        const users = await this.all({
            $not: {
                $in: members.data.list.map(({ user }) => user)
            }
        });
        return users;
    }
}
