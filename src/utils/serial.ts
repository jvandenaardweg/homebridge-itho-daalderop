export function serialNumberFromUUID(uuid: string): number {
  return parseInt(uuid.split('-')[0], 16);
}
