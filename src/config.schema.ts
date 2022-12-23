import { z } from 'zod';
import isIP from 'validator/lib/isIP';
import { PlatformConfig } from 'homebridge';

// this schema should match the config.schema.json
// using zod to validate the config gives us type-safety over the config in our code
export const configSchema = z.object({
  name: z.string({
    required_error: 'A bridge name is required',
  }),
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
});

export type ConfigSchema = z.infer<typeof configSchema> & PlatformConfig;
