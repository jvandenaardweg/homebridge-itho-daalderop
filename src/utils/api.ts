import { FALLBACK_VIRTUAL_REMOTE_COMMAND } from '@/settings';

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

export function getVirtualRemoteCommandForRotationSpeed(
  rotationSpeed: number,
): 'low' | 'medium' | 'high' {
  const min = 0;
  const max = 100;
  const oneThird = (max / 3) * 1;
  const twoThirds = (max / 3) * 2;

  const virtualRemoteMapping = {
    low: [min, oneThird], // 0 - 33.333
    medium: [oneThird, twoThirds], // 33.333 - 66.666
    high: [twoThirds, max], // 66.666 - 100
  } satisfies Record<'low' | 'medium' | 'high', [number, number]>;

  const virtualRemoteCommand = Object.entries(virtualRemoteMapping).find(([, range]) => {
    const [min, max] = range;

    return rotationSpeed >= min && rotationSpeed <= max;
  })?.[0] as 'low' | 'medium' | 'high';

  return virtualRemoteCommand || FALLBACK_VIRTUAL_REMOTE_COMMAND; // fallback to medium when no match is found
}

export function getRotationSpeedForVirtualRemoteCommand(
  virtualRemoteCommand: 'low' | 'medium' | 'auto' | 'high',
): number {
  const min = 0;
  const max = 100;
  const oneThird = (max / 3) * 1;
  const twoThirds = (max / 3) * 2;

  const virtualRemoteMapping = {
    low: [min, oneThird], // 0 - 33.333
    medium: [oneThird, twoThirds], // 33.333 - 66.666
    auto: [oneThird, twoThirds], // 33.333 - 66.666
    high: [twoThirds, max], // 66.666 - 100
  } satisfies Record<'low' | 'medium' | 'auto' | 'high', [number, number]>;

  const [_, maxSpeed] = virtualRemoteMapping[virtualRemoteCommand];

  return maxSpeed;
}
