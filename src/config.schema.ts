import { z } from 'zod';
import isIP from 'validator/lib/isIP';
import { PlatformConfig } from 'homebridge';

// this schema should match the config.schema.json
// using zod to validate the config gives us type-safety over the config in our code
export const configSchema = z.object({
  name: z.string({
    required_error: 'A bridge name is required',
  }),
  device: z
    .object({
      co2Sensor: z
        .boolean({
          invalid_type_error: "'co2Sensor' must be a boolean",
        })
        .optional(),
      nonCve: z
        .boolean({
          invalid_type_error: "'nonCve' must be a boolean",
        })
        .optional(),
    })
    .optional(),
  api: z.object({
    protocol: z.enum(['mqtt', 'http']),
    ip: z
      .string({
        required_error: 'IP address is required for setup',
        invalid_type_error: "'ip' must be a string",
      })
      .refine(
        ip => isIP(ip, 4),
        ip => ({
          message: `'${ip}' is not a valid IPv4 address`,
        }),
      ),
    port: z.number({
      required_error: 'Port is required for setup',
      invalid_type_error: "'port' must be a number",
    }),
    username: z
      .string({
        invalid_type_error: "'username' must be a string",
      })
      .optional(),
    password: z
      .string({
        invalid_type_error: "'password' must be a string",
      })
      .optional(),
  }),
  verboseLogging: z
    .boolean({
      invalid_type_error: "'verboseLogging' must be a boolean",
    })
    .optional(),
});

export type ConfigSchema = z.infer<typeof configSchema> & PlatformConfig;
