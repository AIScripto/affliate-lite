/**
 * URL Parameter Compilation & Token Replacement Test Suite
 * Covers standard attribution tokens, unlimited custom parameters, and URL encoding.
 */

interface ParameterMapping {
  token: string;
  key: string;
  value: string;
}

export function compileUrlTemplate(
  template: string,
  tokens: Record<string, string>,
  customParams: ParameterMapping[] = []
): string {
  let result = template;

  // 1. Replace standard tokens
  Object.entries(tokens).forEach(([token, val]) => {
    const escaped = token.replace(/[{}]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), encodeURIComponent(val));
  });

  // 2. Replace any defined custom parameters
  customParams.forEach(({ token, value }) => {
    const escaped = token.replace(/[{}]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'g'), encodeURIComponent(value));
  });

  return result;
}

export function appendQueryParamToTemplate(
  template: string,
  paramKey: string,
  token: string
): string {
  if (template.includes(token)) {
    return template; // Already present, avoid duplication
  }
  const separator = template.includes('?') ? '&' : '?';
  return `${template}${separator}${paramKey}=${token}`;
}

// Test Case Declarations
export const urlParameterTestCases = [
  {
    name: 'TC-URL-01: Standard Token Substitution',
    description: 'Replaces {master_id}, {click_id}, {ref}, and {sku} correctly with encoded values',
    run: () => {
      const template = 'https://brand.com/p/{sku}?partner_id={master_id}&click_ref={click_id}&sub={ref}';
      const tokens = {
        '{master_id}': 'M_AFF_101',
        '{click_id}': 'clk_s2s_89f3a1',
        '{ref}': 'sub_ali_05',
        '{sku}': 'nike-air-max-270',
      };
      const expected = 'https://brand.com/p/nike-air-max-270?partner_id=M_AFF_101&click_ref=clk_s2s_89f3a1&sub=sub_ali_05';
      const actual = compileUrlTemplate(template, tokens);
      return actual === expected;
    },
  },
  {
    name: 'TC-URL-02: Unlimited Custom Parameter Interpolation',
    description: 'Allows arbitrary number of custom defined tokens ({sub1}, {sub2}, {utm_source}, {ad_id})',
    run: () => {
      const template = 'https://brand.com/p/123?partner={master_id}&click={click_id}&utm_source={utm_source}&sub1={sub1}&ad_id={ad_id}';
      const tokens = {
        '{master_id}': 'CJ_88',
        '{click_id}': 'clk_test_01',
      };
      const customParams: ParameterMapping[] = [
        { token: '{utm_source}', key: 'utm_source', value: 'youtube_shorts' },
        { token: '{sub1}', key: 'sub1', value: 'bio_link' },
        { token: '{ad_id}', key: 'ad_id', value: 'ad_fall_campaign_99' },
      ];
      const actual = compileUrlTemplate(template, tokens, customParams);
      return (
        actual.includes('utm_source=youtube_shorts') &&
        actual.includes('sub1=bio_link') &&
        actual.includes('ad_id=ad_fall_campaign_99')
      );
    },
  },
  {
    name: 'TC-URL-03: 1-Click Parameter Append',
    description: 'Appends &key={token} to URL template without introducing syntax errors or duplicates',
    run: () => {
      const base = 'https://brand.com/products?partner_id={master_id}';
      const step1 = appendQueryParamToTemplate(base, 'click_ref', '{click_id}');
      const step2 = appendQueryParamToTemplate(step1, 'utm_camp', '{utm_camp}');
      // Trying to append {click_id} again should be idempotent
      const step3 = appendQueryParamToTemplate(step2, 'click_ref', '{click_id}');

      return (
        step1 === 'https://brand.com/products?partner_id={master_id}&click_ref={click_id}' &&
        step2 === 'https://brand.com/products?partner_id={master_id}&click_ref={click_id}&utm_camp={utm_camp}' &&
        step3 === step2
      );
    },
  },
  {
    name: 'TC-URL-04: URL Encoding of Special Characters',
    description: 'Encodes spaces, ampersands, and unicode characters in token values safely',
    run: () => {
      const template = 'https://brand.com?source={utm_source}&name={campaign_name}';
      const custom = [
        { token: '{utm_source}', key: 'source', value: 'tiktok ads' },
        { token: '{campaign_name}', key: 'name', value: 'shoes & socks' },
      ];
      const actual = compileUrlTemplate(template, {}, custom);
      return actual.includes('tiktok%20ads') && actual.includes('shoes%20%26%20socks');
    },
  },
];
