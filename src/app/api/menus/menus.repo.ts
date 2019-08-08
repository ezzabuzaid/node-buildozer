import { Body } from '@lib/mongoose';
import { MenusModel, MenusSchema } from './menus.model';

export class MenusRepo extends MenusModel {
    public static async updateEntity(id: string, body: Body<MenusSchema>) {
        const entity = await this.fetchEntityById(id).lean();
        if (!entity) {
            return null;
        }
        entity.set(body);
        return entity.save();
    }

    public static createEntity(doc: Body<MenusSchema>) {
        const user = new MenusRepo(doc);
        return user.save();
    }

    public static deleteEntity(id: string) {
        return this.findOneAndDelete({ _id: id });
    }

    public static entityExist(obj) {
        return this.findOne(obj).lean();
    }

    public static fetchEntities(obj?, ...args) {
        return this.find(obj, ...args);
    }

    public static fetchEntityById(id: string) {
        return this.findOne({ _id: id });
    }
}
