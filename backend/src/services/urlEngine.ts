export interface BrandTemplateParams {
  urlTemplate: string;
  masterAffId: string;
  clickId: string;
  refCode: string;
  sku: string;
  extraParams?: Record<string, string>;
}

export function compileBrandUrl(params: BrandTemplateParams): string {
  const { urlTemplate, masterAffId, clickId, refCode, sku, extraParams } = params;

  let compiled = urlTemplate
    .replace(/\{master_id\}/g, encodeURIComponent(masterAffId))
    .replace(/\{click_id\}/g, encodeURIComponent(clickId))
    .replace(/\{ref\}/g, encodeURIComponent(refCode))
    .replace(/\{sku\}/g, encodeURIComponent(sku));

  if (extraParams && Object.keys(extraParams).length > 0) {
    try {
      const parsedUrl = new URL(compiled);
      for (const [key, val] of Object.entries(extraParams)) {
        if (val) {
          parsedUrl.searchParams.set(key, val);
        }
      }
      compiled = parsedUrl.toString();
    } catch {
      // If template was relative or had unmatched tokens, append standard query string
      const search = new URLSearchParams(extraParams).toString();
      compiled += (compiled.includes('?') ? '&' : '?') + search;
    }
  }

  return compiled;
}
