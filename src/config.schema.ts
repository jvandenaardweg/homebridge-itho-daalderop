import { z } from 'zod';
import isIP from 'validator/lib/isIP';
import { PlatformConfig } from 'homebridge';

// const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
//   if (issue.code === z.ZodIssueCode.invalid_type) {
//     if (issue.expected === 'string') {
//       return { message: 'bad type!' };
//     }
//   }
//   if (issue.code === z.ZodIssueCode.custom) {
//     return { message: `less-than-${(issue.params || {}).minimum}` };
//   }
//   return { message: ctx.defaultError };
// };

// z.setErrorMap(customErrorMap);

// this schema should match the config.schema.json
// using zod to validate the config gives us type-safety over the config in our code
export const configSchema = z.object({
  name: z.string({
    required_error: 'A bridge name is required',
  }),
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
});

export type ConfigSchema = z.infer<typeof configSchema> & PlatformConfig;
