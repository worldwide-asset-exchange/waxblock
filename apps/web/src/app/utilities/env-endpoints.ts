export const parseEndpointList = (
  envVar: string | undefined,
  fallback: string[],
): string[] => {
  const endpoints = envVar
    ?.split(",")
    .map((endpoint) => endpoint.trim())
    .filter(Boolean);

  return endpoints?.length ? endpoints : fallback;
};

export const firstEndpoint = (
  envVar: string | undefined,
  fallback: string[],
): string => parseEndpointList(envVar, fallback)[0] || "";

export const endpointWeights = (
  envVar: string | undefined,
  fallback: string[],
): Record<string, number> =>
  parseEndpointList(envVar, fallback).reduce<Record<string, number>>(
    (endpoints, endpoint) => {
      endpoints[endpoint] = 100;
      return endpoints;
    },
    {},
  );
