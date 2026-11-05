import {
  format as formatDate,
  formatDistanceToNow,
  isValid,
  parseISO,
} from "date-fns";

const TIMEZONE_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i;

const parseDate = (value: string | number | Date) => {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);

  return parseISO(TIMEZONE_SUFFIX.test(value) ? value : `${value}Z`);
};

const dateToISO = (dateString) => {
  if (!dateString) {
    return;
  }

  const date = parseDate(dateString);
  return isValid(date) ? date.toISOString() : undefined;
};

const localDateTimeToISO = (dateValue: string, timeValue: string) => {
  if (!dateValue) return null;

  const date = new Date(`${dateValue}T${timeValue || "00:00"}:00.000`);
  return isValid(date) ? date.toISOString() : null;
};

const normalizeFormat = (format) =>
  format
    .replace(/YYYY/g, "yyyy")
    .replace(/DD/g, "dd")
    .replace(/ddd/g, "EEE")
    .replace(/MMM/g, "MMM")
    .replace(/HH/g, "HH")
    .replace(/hh/g, "hh")
    .replace(/mm/g, "mm")
    .replace(/ss/g, "ss")
    .replace(/SSS/g, "SSS")
    .replace(/A/g, "a");

const momentformat = (dateString, format, utc = false) => {
  if (!dateString) return "";
  const date = parseDate(dateString);
  if (!isValid(date)) return "";

  const targetDate = utc
    ? new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000)
    : date;

  return formatDate(targetDate, normalizeFormat(format));
};

const fromNow = (dateString) => {
  const date = parseDate(dateString);
  return isValid(date) ? formatDistanceToNow(date, { addSuffix: true }) : "";
};

const unixSeconds = (dateString?: string | number | Date) => {
  if (dateString === undefined) return Math.floor(Date.now() / 1000);
  const date = parseDate(dateString);
  return Math.floor(date.getTime() / 1000);
};

const diffSeconds = (dateString: string | Date, base: Date = new Date()) => {
  const date = parseDate(dateString);
  return Math.floor((base.getTime() - date.getTime()) / 1000);
};

export {
  dateToISO,
  diffSeconds,
  fromNow,
  localDateTimeToISO,
  momentformat,
  unixSeconds,
};
