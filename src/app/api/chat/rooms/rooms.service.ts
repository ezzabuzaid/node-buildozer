import { CrudService, CrudDao } from '@shared/crud';
import { Room } from './rooms.model';
import { Singelton, locate } from '@lib/locator';
import { FoldersService } from '@api/uploads';

@Singelton()
export class RoomsService extends CrudService<Room> {
    // TODO: you can easily move the creation logic from the room router to be used here
    // in create post hook, but the problem that we need to pass the user id from the token
    constructor() {
        super(new CrudDao(Room), {
            create: {
                async pre(room) {
                    const folder = await locate(FoldersService).create({ name: room.name, _id: room.id } as any);
                    room.folder = folder.data.id;
                }
            },
        });
    }
}
