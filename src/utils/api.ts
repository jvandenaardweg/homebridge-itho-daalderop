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
