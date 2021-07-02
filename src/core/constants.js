// Record Status
export const RECORD_STATUS_INVALID = 0;
export const RECORD_STATUS_UNREVIEWED = 1;
export const RECORD_STATUS_PUBLIC = 2;
export const RECORD_STATUS_CENSORED = 3;
export const RECORD_STATUS_ARCHIVED = 4;

export const RECORD_STATUSES = {
  [RECORD_STATUS_INVALID]: "invalid",
  [RECORD_STATUS_UNREVIEWED]: "unreviewed",
  [RECORD_STATUS_PUBLIC]: "public",
  [RECORD_STATUS_CENSORED]: "censored",
  [RECORD_STATUS_ARCHIVED]: "archived"
};

// Record State
export const RECORD_STATE_INVALID = 0;
export const RECORD_STATE_UNVETTED = 1;
export const RECORD_STATE_VETTED = 2;

export const RECORD_STATES = {
  [RECORD_STATE_INVALID]: "invalid",
  [RECORD_STATE_UNVETTED]: "unvetted",
  [RECORD_STATE_VETTED]: "vetted"
};
