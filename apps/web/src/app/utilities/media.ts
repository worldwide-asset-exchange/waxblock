import { getIpfsEndpoints, loadIndex } from "./network-endpoints";

export const getMediaUrl = (source?: string | null): string | null => {
  const value = source?.trim();
  if (!value) return null;

  let ipfsPath: string;

  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return null;
    }

    const subdomain = url.hostname.match(/^([^.]+)\.ipfs\./i);
    const path = subdomain
      ? `${subdomain[1]}${url.pathname}`
      : url.pathname.startsWith("/ipfs/")
        ? url.pathname.slice(6)
        : null;

    if (path === null) return value;
    if (!path) return null;
    ipfsPath = `${path}${url.search}${url.hash}`;
  } else {
    ipfsPath = value.replace(/^(?:ipfs:\/\/(?:ipfs\/)?|\/?ipfs\/)/i, "");
    if (!ipfsPath || /^[a-z][a-z\d+.-]*:/i.test(ipfsPath)) return null;
  }

  const endpoints = getIpfsEndpoints();
  return `${endpoints[loadIndex("ipfs", endpoints)]}${ipfsPath}`;
};
