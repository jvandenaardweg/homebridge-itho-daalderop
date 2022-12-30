import { FALLBACK_VIRTUAL_REMOTE_COMMAND } from '@/settings';
import {
  FanInfo,
  supportedVirtualRemoteCommands,
  SupportedVirtualRemoteCommands,
  VirtualRemoteMapping,
} from '@/types';

function getVirtualRemoteMapping(): VirtualRemoteMapping {
  const min = 0;
  const max = 100;
  const oneThird = (max / 3) * 1;
  const twoThirds = (max / 3) * 2;

  const virtualRemoteMapping = {
    low: [min, oneThird], // 0 - 33.333
    medium: [oneThird, twoThirds], // 33.333 - 66.666
    high: [twoThirds, max], // 66.666 - 100
  } satisfies VirtualRemoteMapping;

  return virtualRemoteMapping;
}

export function sanitizeStatusPayload<T>(message: string): T {
  const data = JSON.parse(message);

  // Replace "not available" with null
  const sanitizedData = Object.entries(data).map(([key, value]) => {
    if (typeof value === 'string') {
      if (value === 'not available') {
        return [key, null];
      }
    }

    return [key, value];
  });

  return Object.fromEntries(sanitizedData) as T;
}

/**
 * Get the virtual remote command for the given rotation speed
 *
 * Will default to the medium speed when no match is found
 */
export function getVirtualRemoteCommandForRotationSpeed(
  rotationSpeed: number,
): SupportedVirtualRemoteCommands {
  const virtualRemoteMapping = getVirtualRemoteMapping();

  const virtualRemoteCommand = Object.entries(virtualRemoteMapping).find(([, range]) => {
    const [min, max] = range;

    return rotationSpeed >= min && rotationSpeed <= max;
  })?.[0] as SupportedVirtualRemoteCommands;

  return virtualRemoteCommand || FALLBACK_VIRTUAL_REMOTE_COMMAND; // fallback to medium when no match is found
}

/**
 * Map the FanInfo value to the rotation speed
 *
 * Will default to the medium speed when the fan is in auto mode
 * or the FanInfo is not a supported virtual remote command (low, medium, high)
 */
export function getRotationSpeedFromFanInfo(fanInfo?: FanInfo): number {
  const virtualRemoteMapping = getVirtualRemoteMapping();

  let virtualRemoteCommand: SupportedVirtualRemoteCommands = FALLBACK_VIRTUAL_REMOTE_COMMAND;

  if (fanInfo === 'auto') {
    virtualRemoteCommand = 'medium';
  }

  // If the FanInfo is low, medium or high, we'll use that as the virtual remote command
  // Any other value will fallback to medium, as defined above
  if (supportedVirtualRemoteCommands.includes(fanInfo as never)) {
    virtualRemoteCommand = fanInfo as SupportedVirtualRemoteCommands;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, maxSpeed] = virtualRemoteMapping[virtualRemoteCommand];

  return maxSpeed;
}
