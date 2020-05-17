import { CrudService, Repo } from '@shared/crud';
import foldersModel, { FoldersSchema, } from './folders.model';
import sharedFolderService from '../shared-folder/shared-folder.service';
import { Directories } from '@shared/common';

export class FoldersService extends CrudService<FoldersSchema> {

    constructor() {
        super(new Repo(foldersModel), {
            unique: ['name'],
            create: {
                post(folder) {
                    Directories.createFolderDirectory(folder.id);
                }
            },
            update: {
                async pre(folder) {
                    const sharedFolder = await sharedFolderService.one({ folder: folder.id });
                    if (sharedFolder.data.shared) {
                        throw new Error('Shared folder cannot updated');
                    }
                },
            },
            delete: {
                async pre(folder) {
                    const sharedFolder = await sharedFolderService.one({ folder: folder.id });
                    if (sharedFolder.data.shared) {
                        throw new Error('Shared folder cannot deleted');
                    }
                },
                post(folder) {
                    Directories.removeFolder(folder.id);
                }
            }
        });
    }
}

export default new FoldersService();
