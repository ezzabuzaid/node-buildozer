import { AppUtils } from '@core/utils';
import 'reflect-metadata';
import { MongooseTypes } from '.';

// TODO: the `type` property shouldn't be in the `options` type

export function Field<T = any>(options: MongooseTypes.FieldOptions = {}) {
    return (instance: MongooseTypes.IFieldAttr & T, propertyKey: string) => {
        // TODO: use reflect metadate instead of conditions
        if (instance && !instance.fields) {
            AppUtils.defineProperty(instance, 'fields', { value: {} });
        }
        const fields = instance.fields;
        const propertyType = Reflect.getMetadata('design:type', instance, propertyKey);
        let defaults: typeof options = {};
        if (!options['pure'] && propertyType.name === String.name) {
            defaults = {
                lowercase: true,
                trim: true,
                required: true
            };
        }
        fields[propertyKey] = {
            type: propertyType.name,
            ...defaults,
            ...options
        };
    };
}
