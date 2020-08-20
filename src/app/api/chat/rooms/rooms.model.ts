import { Constants } from '@core/constants';
import { Entity, Field, ForeignKey, locateModel } from '@lib/mongoose';
import { Message } from '../messages';

// FIXME
// cannot use RoomMemberSchema as submodel for single or mutliple mode,
// because the declration of the subschema is different than the primitive types
// so we need to find a way to solve this by not adding at as Type https://mongoosejs.com/docs/subdocs.html
// Another Issue, is that the fields in subdocument will stay a properties unless you add @Entity which in our case
// not needed because @Entity will register it as mongose model,
//  you can pass an option with @Entity to not to create model

@Entity(Constants.Schemas.ROOMS)
export class Room {
    @Field() folder?: ForeignKey = null;
    @Field({ pure: true }) public name: string = null;
    @Field({ pure: true }) public avatar?: string = null;
    @Field() single = true;

    lastMessage?: Message;
}
