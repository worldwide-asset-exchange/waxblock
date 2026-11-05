import { useState, type ImgHTMLAttributes } from "react";
import { getTokenLogo } from "../utilities/tokens";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  contract: string;
  symbol: string;
  candidates: readonly string[];
};

const TokenLogo = ({ contract, symbol, candidates, ...props }: Props) => {
  const [failedSources, setFailedSources] = useState(() => new Set<string>());
  const src = [
    ...candidates,
    getTokenLogo({ contract, currency: symbol }),
  ].find((candidate) => !failedSources.has(candidate));

  return (
    <img
      alt=""
      loading="lazy"
      decoding="async"
      {...props}
      src={src}
      onError={() => {
        if (src) setFailedSources((failed) => new Set(failed).add(src));
      }}
    />
  );
};

export default TokenLogo;
