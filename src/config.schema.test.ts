import configSchemaJson from '../config.schema.json';
import { configSchema, ConfigSchema } from './config.schema';
import { DEFAULT_BRIDGE_NAME, PLATFORM_NAME } from './settings';

// Sanity check, as we don't import config.schema.json in our code, we have no type-safety over the config.schema.json values and our types
// These tests will fail if we change names or requirements in config.schema.json that are not reflected in our types
describe('config.schema.json', () => {
  it('should have the correct name property', async () => {
    const nameProperty: keyof ConfigSchema = 'name';
    const apiProperty: keyof ConfigSchema = 'api';
    const verboseLoggingProperty: keyof ConfigSchema = 'verboseLogging';

    const properties = configSchemaJson.schema.properties;

    // now we get an error if we change the property name in config.schema.json and/or our types
    expect(properties).toHaveProperty(nameProperty);
    expect(properties.name).toHaveProperty('required');
    expect(properties.name.required).toBe(true);
    expect(properties.name.type).toBe('string');
    expect(properties.name.default).toBe(DEFAULT_BRIDGE_NAME);

    expect(properties).toHaveProperty(verboseLoggingProperty);
    expect(properties.verboseLogging).toHaveProperty('required');
    expect(properties.verboseLogging.required).toBe(false);
    expect(properties.verboseLogging.type).toBe('boolean');
    expect(properties.verboseLogging.default).toBe(false);

    const apiProperties = properties.api.properties;

    expect(properties).toHaveProperty(apiProperty);
    expect(apiProperties.protocol).toHaveProperty('required');
    expect(apiProperties.protocol.required).toBe(true);
    expect(apiProperties.protocol.type).toBe('string');
    expect(apiProperties.protocol.default).toBe('mqtt');
    expect(apiProperties.protocol.oneOf.map(o => o.title)).toMatchObject(['HTTP', 'MQTT']);
    expect(apiProperties.protocol.oneOf.map(o => o.enum)).toMatchObject([['http'], ['mqtt']]);

    expect(apiProperties.ip).toHaveProperty('required');
    expect(apiProperties.ip.required).toBe(true);
    expect(apiProperties.ip.type).toBe('string');
    expect(apiProperties.ip.format).toBe('ipv4');

    expect(apiProperties.port).toHaveProperty('required');
    expect(apiProperties.port.required).toBe(true);
    expect(apiProperties.port.type).toBe('number');

    expect(apiProperties.username).toHaveProperty('required');
    expect(apiProperties.username.required).toBe(false);
    expect(apiProperties.username.type).toBe('string');

    expect(apiProperties.password).toHaveProperty('required');
    expect(apiProperties.password.required).toBe(false);
    expect(apiProperties.password.type).toBe('string');
  });

  it('should succeed the validation with valid config values', () => {
    const configSchemaValues: ConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
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

  it('should error when api is missing', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError('Required');
  });

  it('should error when api.protocol is missing', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
      api: {
        ip: '192.168.0.10',
        port: 1883,
        // protocol: 'mqtt',
      },
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError('Required');
  });
  it('should error when api.ip is missing', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
      api: {
        // ip: '192.168.0.10',
        port: 1883,
        protocol: 'mqtt',
      },
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError('IP address is required for setup');
  });

  it('should error when api.port is missing', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
      api: {
        ip: '192.168.0.10',
        // port: 1883,
        protocol: 'mqtt',
      },
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError('Port is required for setup');
  });

  it('should error when api.protocol is not "mqtt" or "http"', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
      api: {
        ip: '192.168.0.10',
        port: 1883,
        protocol: 'something-else',
      },
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError(
      `Invalid enum value. Expected 'mqtt' | 'http', received 'something-else'`,
    );
  });

  it('should error when api.ip is not a ipv4 address', () => {
    const invalidConfigSchema = {
      platform: PLATFORM_NAME,
      name: DEFAULT_BRIDGE_NAME,
      api: {
        ip: 'some.invalid.ip.address',
        port: 1883,
        protocol: 'mqtt',
      },
    };

    const schemaValidation = () => {
      configSchema.parse(invalidConfigSchema);
    };

    expect(schemaValidation).toThrowError(`'some.invalid.ip.address' is not a valid IPv4 address`);
  });
});
