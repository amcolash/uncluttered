export const API = 'http://localhost:7001';

export function formatCategory(key: string) {
  return key
    .toLowerCase()
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
