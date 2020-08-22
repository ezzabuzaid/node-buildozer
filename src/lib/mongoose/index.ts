export * from './field';
export * from './entity';

import { Schema, SchemaType, SchemaTypeOpts, Types, Document as MongooseDocument } from 'mongoose';
import { OmitProperties } from '@core/utils';

export type Document<T> = T & MongooseDocument;
export namespace MongooseTypes {

    export type FieldOptions = SchemaTypeOpts<any> | Schema | SchemaType & {
        pure?: boolean;
        subdocument: boolean;
    };
    export interface IFieldAttr {
        fields: { [keys: string]: FieldOptions };
    }

}

export type CastObjectIDToString<T> = { [key in keyof T]: T[key] extends Types.ObjectId ? string : T[key] };
export type WithID<T> = { id?: Types.ObjectId } & T;
export type WithMongoID<T> = { _id: Types.ObjectId } & T;

export type Payload<T> = OmitProperties<T, (...args: any) => any> & {
    updatedAt?: string;
    createdAt?: string;
};

export function generateModelMetadataKey(target: any) {
    return `model:${ target.name }`;
}

export type Projection<T> = Partial<{ [key in keyof Payload<T>]: 1 | 0 }>;
export type SortDirection = 'asc' | 'desc' | 'ascending' | 'descending';
export type IColumnSort<T> = {
    [ket in keyof (T & {
        createdAt: string;
        updatedAt: string;
    })]?: SortDirection
};
export type PrimaryKey = Types.ObjectId;
export type ForeignKey = Types.ObjectId;
export const PrimaryKey = Types.ObjectId;
