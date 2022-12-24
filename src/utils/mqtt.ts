export function sanitizeMQTTMessage<T>(message: Buffer): T {
  const messageString = message.toString();

  const data = JSON.parse(messageString);

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
