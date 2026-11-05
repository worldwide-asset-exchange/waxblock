export function getHeaderActiveMenu(pathname: string) {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/wallet")) return "wallet";
  if (pathname.startsWith("/tokens")) return "tokens";
  if (pathname.startsWith("/settings")) return "settings";
  if (
    pathname.startsWith("/chain") ||
    pathname.startsWith("/protocol-features") ||
    pathname.startsWith("/vote") ||
    pathname.startsWith("/namebids")
  ) {
    return "more";
  }
  return "home";
}

export function getWalletActiveMenu(pathname: string) {
  if (pathname === "/wallet") return "wallet";
  if (pathname === "/wallet/transfer") return "transfer";
  if (pathname.startsWith("/wallet/resources")) return "resources";
  if (pathname.startsWith("/wallet/ram")) return "ram";
  if (pathname.startsWith("/wallet/permissions")) return "permissions";
  if (pathname.startsWith("/wallet/msig")) return "msig";
  if (pathname.startsWith("/wallet/vote")) return "vote";
  if (pathname.startsWith("/wallet/bidnames")) return "bidnames";
  if (pathname.startsWith("/wallet/gbm-rewards")) return "gbm-rewards";
  if (pathname.startsWith("/wallet/utilities")) return "utilities";
  if (pathname.startsWith("/wallet/create-account")) return "create-account";
  if (pathname.startsWith("/wallet/powerup")) return "powerup";
  return "wallet";
}

export function getAccountTabFromHash(hash: string) {
  const tab = hash.replace("#", "") || "transactions";
  if (tab === "staked-from" || tab === "staked-to") return "staked";
  return tab;
}

export function getHomeTabFromHash(hash: string) {
  return hash.replace("#", "") || "producers";
}

export function getSettingsActiveMenu(pathname: string) {
  if (pathname.startsWith("/settings/network") || pathname === "/settings") {
    return "network";
  }
  return "network";
}
