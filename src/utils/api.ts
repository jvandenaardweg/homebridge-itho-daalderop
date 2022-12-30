import { FALLBACK_VIRTUAL_REMOTE_COMMAND } from '@/settings';
import {
  ActualMode,
  FanInfo,
  supportedVirtualRemoteCommands,
  SupportedVirtualRemoteCommands,
  VirtualRemoteMapping,
} from '@/types';

/**
 * Get the virtual remote mapping.
 *
 * This is used to map the rotation speed to a virtual remote command.
 */
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

/**
 * Sanitizes the status payload by replacing `"not available"` with `null`.
 */
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
 * Get the virtual remote command for the given rotation speed.
 *
 * Will default to the medium speed when no match is found.
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
 * Map the FanInfo value to the rotation speed.
 *
 * Will default to the medium speed when the fan is in auto mode or the FanInfo is not a supported virtual remote command (low, medium, high).
 *
 * - FanInfo `"auto"` = `"medium"`
 * - FanInfo `"low"` = `"low"`
 * - FanInfo `"medium"` = `"medium"` (auto)
 * - FanInfo `"high"` = `"high"`
 * - FanInfo `"anything else"` = `"medium"` (auto)
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

/**
 * Map the ActualMode value to the rotation speed.
 *
 * Will default to the medium speed when the ActualMode is not a supported virtual remote command (low, medium, high).
 *
 * - ActualMode `1` = `"low"`
 * - ActualMode `2` = `"medium"`
 * - ActualMode `3` = `"high"`
 * - ActualMode `24` = `"auto"`
 * - ActualMode `anything else` = `"medium"`
 *
 * @link: https://github.com/arjenhiemstra/ithowifi/wiki/Non-CVE-units-support
 */
export function getRotationSpeedFromActualMode(actualMode?: ActualMode): number {
  const virtualRemoteMapping = getVirtualRemoteMapping();

  let virtualRemoteCommand: SupportedVirtualRemoteCommands = FALLBACK_VIRTUAL_REMOTE_COMMAND;

  if (actualMode === 1) {
    virtualRemoteCommand = 'low';
  }

  // It seems we can't set the fan to "auto" mode, so we'll map 24 to "medium" instead
  // https://github.com/arjenhiemstra/ithowifi/issues/47#issuecomment-960115941
  if (actualMode === 2 || actualMode === 24) {
    virtualRemoteCommand = 'medium';
  }

  if (actualMode === 3) {
    virtualRemoteCommand = 'high';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, maxSpeed] = virtualRemoteMapping[virtualRemoteCommand];

  return maxSpeed;
}
