import { CrudService, CrudDao } from '@shared/crud';
import { RoomMember } from './members.model';
import sharedFolder from '@api/uploads/shared-folder/shared-folder.service';
import { PrimaryKey } from '@lib/mongoose';
import { Room } from '../rooms';
import { AppUtils } from '@core/utils';
import { locate } from '@lib/locator';
import { MessagesService } from '../messages';

export class RoomMembersService extends CrudService<RoomMember> {
    constructor() {
        super(new CrudDao(RoomMember), {
            create: {
                async post(member) {
                    const populatedMember = await member.populate('room').execPopulate();
                    await sharedFolder.create({
                        folder: (populatedMember.room as unknown as Room).folder,
                        shared: true,
                        user: member.user as any
                    });
                }
            }
        });
    }

    async getUserRooms(user_id: PrimaryKey, userName?: string, single = false) {
        const result = await this.all({
            user: user_id
        }, {
            populate: {
                path: 'room',
                match: {
                    single,
                }
            },
            projection: {
                room: 1,
            },
            lean: true
        });
        for (const document of result.data.list) {
            if (document.room) {
                document.room['lastMessage'] = await locate(MessagesService).getFirstMessage(document.room);
                if (document.room['single']) {
                    const names = (document.room['name'] as string).split(',');
                    document.room['name'] = names[+!names.indexOf(userName)];
                }
            }
        }
        return {
            ...result.data,
            list: result.data.list.map(({ room }) => room).filter(AppUtils.isTruthy)
        };
    }

    getRoom(ids: PrimaryKey[]) {
        return this.dao.model.aggregate([
            {
                $group: {
                    _id: '$room',
                    members: {
                        $push: {
                            $toString: '$user',
                        }
                    },

                },
            }])
            .exec()
            .then((rooms) => {
                return rooms.find((room) => {
                    // TODO: check if there's a way to this check using mongo aggregate
                    return ids.every((element) => room.members.includes(element));
                }) || null;
            });
    }
}

