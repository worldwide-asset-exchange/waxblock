const bufferToHex = function (buffer) {
  let s = "";
  const h = "0123456789ABCDEF";
  new Uint8Array(buffer).forEach((v) => {
    s += h[v >> 4] + h[v & 15];
  });
  return s;
};

const convertToHex = function (uint8View) {
  let hexText = "";

  for (let i = 0; i < uint8View.length; i++) {
    const charVal = uint8View[i];
    hexText =
      hexText + "" + (charVal < 16 ? "0" : "") + this.dec2hex(charVal) + "";
  }

  return hexText;
};

const hexToString = function (hex) {
  if (!hex.match(/^[0-9a-fA-F]+$/)) {
    //throw new Error('is not a hex string.');
    return hex;
  }
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }
  const bytes = [];
  for (let n = 0; n < hex.length; n += 2) {
    const code = parseInt(hex.substr(n, 2), 16);
    bytes.push(code);
  }
  return bytes;
};

const getPrecision = function (num: string | number) {
  const numStr = String(num);
  const splits = numStr.split(" ");
  const pds = splits[0].split(".");
  return pds[1] ? pds[1].length : 0;
};

// Function to convert various representations of boolean values to proper boolean
const convertToBoolean = function (value) {
  if (typeof value === "boolean") {
    // If it's already a boolean, no conversion needed
    return value;
  } else if (typeof value === "string") {
    // Convert string representations
    const lowerCaseValue = value.toLowerCase();
    if (lowerCaseValue === "true" || lowerCaseValue === "1") {
      return true;
    } else if (lowerCaseValue === "false" || lowerCaseValue === "0") {
      return false;
    }
  } else if (typeof value === "number") {
    if (value === 1) {
      return true;
    } else if (value === 0) {
      return false;
    }
  }
  // If it's not a boolean or a recognized string representation, return false by default
  return false;
};

export {
  bufferToHex,
  convertToHex,
  hexToString,
  getPrecision,
  convertToBoolean,
};
