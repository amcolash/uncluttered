const PORT = 7001;
export const API = `${window.location.origin.replace(`:${window.location.port}`, `:${PORT}`)}`;

export function formatCategory(key: string) {
  return key
    .toLowerCase()
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
