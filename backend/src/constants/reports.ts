/** Number of points drawn on dashboard and report trend graphs. */
export const TIMELINE_BUCKET_COUNT = 6;

/** Data spans shorter than this are labelled by time (HH:MM), longer spans by date (DD/MM). */
export const TIMELINE_TIME_LABEL_MAX_HOURS = 36;

/** When there is no data yet, the empty graph covers this many hours back from now. */
export const TIMELINE_EMPTY_RANGE_HOURS = 24;

/** Timezone used for graph labels. Set REPORTS_TIMEZONE (e.g. "Asia/Karachi") to match the business. */
export const REPORTS_TIMEZONE = process.env.REPORTS_TIMEZONE || 'UTC';

/** Accepted values for the conversion status filter on reports. */
export const REPORT_STATUS_FILTERS = ['ALL', 'APPROVED', 'UNCHECKED', 'DECLINED'] as const;

/** Upper bound for the free-text search box on reports. */
export const REPORT_SEARCH_MAX_LENGTH = 200;

/** Days shown on the dashboard traffic chart. */
export const DASHBOARD_HISTORY_DAYS = 30;

/** Rows shown in dashboard Top Offers / Top Publishers lists. */
export const DASHBOARD_TOP_LIST_SIZE = 10;

/** Shortest time span a graph covers, so buckets never share the same label. */
export const TIMELINE_MIN_SPAN_HOURS = 6;
