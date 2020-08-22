import { CrudService, CrudDao, IReadAllOptions, WriteResult, Pagination } from '@shared/crud';
import { Message } from './messages.model';
import { PrimaryKey, Payload } from '@lib/mongoose';
import { Result } from '@core/response';
import { Singelton } from '@lib/locator';

@Singelton()
export class MessagesService extends CrudService<Message> {
    constructor() {
        super(new CrudDao(Message));
    }

    getMessage(room: PrimaryKey, options: IReadAllOptions<Message>) {
        return super.all({ room }, {
            ...options,
            sort: {
                order: 'descending'
            }
        });
    }

    getLastMessage(room: PrimaryKey) {
        return this.dao
            .fetchAll({ room }, { sort: { createdAt: 'desc' } })
            .limit(1)
            .then(docs => docs[0]);
    }


    public search(text: string, options: Pagination) {
        return this.all({
            text: {
                $regex: text,
                $options: 'i'
            }
        }, options);
    }
}

