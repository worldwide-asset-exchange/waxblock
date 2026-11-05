import config from "../config";

const numberFormat = (number) => {
  number = Number(number).toLocaleString(undefined);

  return number;
};

const tokenFormat = (token: string | number, precision?: number) => {
  precision =
    typeof precision === "undefined" ? config.token_precision : precision;

  const normalizedToken =
    token === null || typeof token === "undefined" || token === "" ? 0 : token;

  token = Number(parseFloat(normalizedToken.toString()));
  token = Number.isNaN(token) ? 0 : token;
  token = token.toFixed(precision);

  token = Number(token).toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return token;
};

const tokenInputFormat = (token, precision) => {
  precision =
    typeof precision === "undefined" ? config.token_precision : precision;

  const normalizedToken =
    token === null || typeof token === "undefined" || token === "" ? 0 : token;

  token = Number(parseFloat(normalizedToken));
  token = Number.isNaN(token) ? 0 : token;
  token = token.toFixed(precision);

  token = Number(token).toLocaleString("en-US", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
  token = token.replace(/,/g, "");

  return token;
};

const currencyFormat = (value: number, precision: number = 2) => {
  precision = typeof precision === "undefined" ? 2 : precision;

  value = Number(value);
  const fixedValue = value.toFixed(precision);

  return Number(fixedValue).toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
};

const bytesFormat = (bytes, precision) => {
  if (bytes < 0) return "∞ Bytes";

  if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return "-";
  if (typeof precision === "undefined") precision = 1;
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  let number = Math.floor(Math.log(bytes) / Math.log(1024));
  if (String(number).toLowerCase() === "-infinity") {
    number = 0;
  }
  return (
    (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +
    " " +
    units[number]
  );
};

const microsecondsFormat = (microseconds: number, precision: number = 0) => {
  if (microseconds < 0) return "∞ ms";

  const hours = Number(
    (microseconds / (60 * 60 * 1000 * 1000)).toFixed(precision),
  );
  const minutes = Number(
    (microseconds / (60 * 1000 * 1000)).toFixed(precision),
  );
  const seconds = Number((microseconds / (1000 * 1000)).toFixed(precision));
  const milliseconds = Number((microseconds / 1000).toFixed(precision));

  if (hours >= 1) {
    return hours + " " + "h";
  } else if (minutes >= 1) {
    return minutes + " " + "m";
  } else if (seconds >= 1) {
    return seconds + " " + "s";
  } else if (milliseconds > 0) {
    return milliseconds + " " + "ms";
  } else {
    return milliseconds + " " + "ms";
  }
};

const shortNumberFormat = (number) => {
  const abs = Math.abs(number);
  if (abs >= Math.pow(10, 12)) {
    // trillion
    number = (number / Math.pow(10, 12)).toFixed(2) + "T";
  } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
    // billion
    number = (number / Math.pow(10, 9)).toFixed(2) + "B";
  } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
    // million
    number = (number / Math.pow(10, 6)).toFixed(2) + "M";
  } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
    // thousand
    number = (number / Math.pow(10, 3)).toFixed(2) + "K";
  } else {
    number = number.toFixed(2);
  }

  return number;
};

export {
  numberFormat,
  tokenFormat,
  tokenInputFormat,
  currencyFormat,
  bytesFormat,
  microsecondsFormat,
  shortNumberFormat,
};
