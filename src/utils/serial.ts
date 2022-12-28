export function serialNumberFromUUID(uuid: string): string {
  return uuid.split('-').join('').slice(0, 16);
}
