/**
 * Replaces {macro} tokens (any case) in a URL template with URL-encoded values.
 * Unknown macros are left as they are. Used for click destination URLs and publisher postbacks.
 */
export function fillUrlTemplate(template: string, macros: Record<string, string>): string {
  return template.replace(/\{([a-z0-9_]+)\}/gi, (whole, name: string) => {
    const value = macros[name.toLowerCase()];
    return value === undefined ? whole : encodeURIComponent(value);
  });
}
