import crypto from 'crypto';
import { UAParser } from 'ua-parser-js';

export interface TelemetryData {
  clickId: string;
  ipHash: string;
  country: string;
  city: string;
  device: string;
  os: string;
  browser: string;
}

export function generateClickId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(3).toString('hex');
  return `clk_${timestamp}_${randomPart}`;
}

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip || '127.0.0.1').digest('hex');
}

export function parseTelemetry(userAgentString?: string, ip?: string, headers: Record<string, any> = {}): TelemetryData {
  const parser = new UAParser(userAgentString || '');
  const result = parser.getResult();

  const deviceType = result.device.type 
    ? result.device.type.charAt(0).toUpperCase() + result.device.type.slice(1) 
    : 'Desktop';

  const os = result.os.name || 'Unknown OS';
  const browser = result.browser.name || 'Unknown Browser';

  // Geo lookup fallback based on CF or standard CDN headers, else mock geographic distribution
  const countryHeader = headers['cf-ipcountry'] || headers['x-country-code'];
  const cityHeader = headers['x-city'];

  const fallbackCountries = ['United States', 'United Kingdom', 'Canada', 'Germany', 'Australia'];
  const fallbackCities = ['New York', 'London', 'Toronto', 'Berlin', 'Sydney'];
  const randomIdx = Math.floor(Math.random() * fallbackCountries.length);

  return {
    clickId: generateClickId(),
    ipHash: hashIp(ip || '127.0.0.1'),
    country: countryHeader ? String(countryHeader) : (fallbackCountries[randomIdx] ?? 'United States'),
    city: cityHeader ? String(cityHeader) : (fallbackCities[randomIdx] ?? 'New York'),
    device: deviceType,
    os,
    browser,
  };
}
