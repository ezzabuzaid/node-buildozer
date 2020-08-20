import { Constants } from '@core/constants';
import { Entity, Field, PrimaryKey } from '@lib/mongoose';

@Entity(Constants.Schemas.MESSAGES)
export class Message {
    @Field({ lowercase: false }) text: string;
    @Field({ required: true }) user: PrimaryKey;
    @Field({ required: true }) room: PrimaryKey;
    @Field({ required: true }) order: number;
}
