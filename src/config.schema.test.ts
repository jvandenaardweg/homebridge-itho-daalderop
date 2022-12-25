import configSchemaJson from '../config.schema.json';
import { configSchema, ConfigSchema } from './config.schema';
import { PLATFORM_NAME } from './settings';

// Sanity check, as we don't import config.schema.json in our code, we have no type-safety over the config.schema.json values and our types
// These tests will fail if we change names or requirements in config.schema.json that are not reflected in our types
describe('config.schema.json', () => {
  it('should have the correct name property', async () => {
    const nameProperty: keyof ConfigSchema = 'name';

    const properties = configSchemaJson.schema.properties;

    // now we get an error if we change the property name in config.schema.json and/or our types
    expect(properties).toHaveProperty(nameProperty);
    expect(properties.name).toHaveProperty('required');
    expect(properties.name.required).toBe(true);
    expect(properties.name.type).toBe('string');
    expect(properties.name.default).toBe('Itho Daalderop');
  });

  it('should succeed the validation with valid config values', () => {
    const configSchemaValues: ConfigSchema = {
      platform: PLATFORM_NAME,
      name: 'Itho Daalderop',
      api: {
        ip: '192.168.0.10',
        port: 1883,
        protocol: 'mqtt',
      },
    };

    const schemaValidation = () => {
      configSchema.parse(configSchemaValues);
    };

    expect(schemaValidation).not.toThrowError();
  });

  it('should error when bridge Name is missing', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError('A bridge name is required');
  });
});
