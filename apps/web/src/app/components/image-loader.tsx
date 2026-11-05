import { useState } from "react";
import Skeleton from "react-loading-skeleton";

const ImageLoader = ({
  src,
  className,
  style,
  alt,
}: {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded ? (
        <Skeleton style={{ height: "200px", width: "200px", ...style }} />
      ) : null}
      <img
        style={{ ...style, display: !loaded ? "none" : "" }}
        src={src}
        className={className}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = "/no-image.png";
        }}
        alt={alt}
      />
    </>
  );
};

export default ImageLoader;
