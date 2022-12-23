import { IthoDaalderopAccessoryContext } from '@/types';
import hap from 'hap-nodejs';

export const mockDisplayName = `CVE ECO`;
export const mockUUID = hap.uuid.generate(mockDisplayName);

export const mockAccessoryContext = {
  somethingExtra: 'test',
} satisfies IthoDaalderopAccessoryContext;
