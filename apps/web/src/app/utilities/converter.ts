import config from "../config";
import { unixSeconds } from "./date";

const calculatedVoteWeight = () => {
  const timestamp_epoch = 946684800;
  const dates_number = unixSeconds() - timestamp_epoch;
  const weight_number =
    Math.floor(dates_number / (86400 * 7)) /
    (config.network_type === "localnet" ? 52 : 13); //86400 = seconds per day 24*3600

  const calculatedVoteWeight = Math.pow(2, weight_number);

  return calculatedVoteWeight;
};

const convertLetterToNumber = (str) => {
  let out = 0;
  const len = str.length;
  for (let pos = 0; pos < len; pos++) {
    out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
  }
  return out;
};

export { calculatedVoteWeight, convertLetterToNumber };
