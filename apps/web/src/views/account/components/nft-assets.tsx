import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import ImageLoader from "../../../app/components/image-loader";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import { numberFormat } from "../../../app/utilities/format";
import {
  getAssetId,
  getAuthor,
  getCollectionName,
  getImage,
  getName,
  getVideo,
} from "../../../app/utilities/nft";

const NftAssets = () => {
  const params = useParams();
  const [filterCollections, setFilterCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [nfts, setNfts] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    BlockchainApiManager.getNfts(params.account, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setNfts(data);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        if (controller.signal.aborted || fetchError?.name === "AbortError") {
          return;
        }
        setError(fetchError);
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [params.account]);

  const collections = useMemo(() => {
    if (!nfts) return [];

    const collections = [];
    nfts.data.forEach((nft) => {
      const newCollection =
        nft.contract === "atomicassets"
          ? nft.collection.collection_name
          : nft.category;
      const collection = collections.find(
        (collection) => collection === newCollection,
      );
      if (!collection) {
        collections.push(newCollection);
      }
    });

    return collections;
  }, [nfts]);

  const filteredNfts = useMemo(() => {
    if (!nfts) return [];

    return nfts.data.filter((nft) => {
      const collection =
        nft.contract === "atomicassets"
          ? nft.collection.collection_name
          : nft.category;
      return filterCollections.length
        ? filterCollections.includes(collection)
        : true;
    });
  }, [nfts, filterCollections]);

  const itemsPerPage = 20;

  const pageCount = useMemo(
    () => Math.ceil(filteredNfts.length / itemsPerPage),
    [filteredNfts.length, itemsPerPage],
  );

  const currentItems = useMemo(
    () => filteredNfts.slice(0, page * itemsPerPage),
    [filteredNfts, page, itemsPerPage],
  );

  const handlePageClick = (page) => {
    setPage(page);
  };

  return (
    <>
      {isLoading ? <p>Loading...</p> : null}

      {error ? <p>Error fetching...</p> : null}

      {nfts ? (
        <>
          <h3>
            Showing {numberFormat(filteredNfts.length)} /{" "}
            {numberFormat(nfts.total)} NFTs
          </h3>

          {filterCollections.length ? (
            <>
              <h3>Filtered collections</h3>
              <p>{filterCollections.join(", ")}</p>
            </>
          ) : null}
          <h3>Filter by Collection</h3>
          {collections.map((collection, index) => (
            <a
              className={`more_btn ${
                filterCollections.includes(collection) ? "active" : ""
              }`}
              style={{
                marginBottom: "10px",
                padding: "10px",
                width: "auto",
                cursor: "pointer",
                marginRight: "10px",
                fontSize: "12px",
                lineHeight: "14px",
                background: filterCollections.includes(collection)
                  ? "#7D70F6"
                  : "#404047",
              }}
              key={index}
              onClick={() => {
                setFilterCollections((filterCollections) => {
                  if (filterCollections.includes(collection)) {
                    return filterCollections.filter(
                      (filterCollection) => filterCollection !== collection,
                    );
                  }

                  return [...filterCollections, collection];
                });
                setPage(1);
              }}
            >
              {collection}
            </a>
          ))}

          <div className="assets_tiles">
            {currentItems.map((nft, index) => (
              <div className="assets_tile" key={index}>
                <figure
                  style={{
                    height: "250px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {getImage(nft) ? (
                    <>
                      <ImageLoader
                        src={getImage(nft)}
                        style={{
                          maxHeight: "250px",
                          maxWidth: "250px" /*verticalAlign: "unset"*/,
                        }}
                        className="card-img-top"
                      />
                    </>
                  ) : null}
                  {!getImage(nft) && getVideo(nft) ? (
                    <video
                      controls
                      style={{
                        maxHeight: "250px",
                        maxWidth: "250px" /*width: "100%"*/,
                      }}
                      className="card-img-top"
                    >
                      <source src={getVideo(nft)} type="video/mp4" />
                    </video>
                  ) : null}
                  {!getImage(nft) && !getVideo(nft) ? (
                    <img
                      src={`/no-image.png`}
                      alt=""
                      style={{
                        maxHeight: "250px",
                        maxWidth: "250px" /*verticalAlign: "unset"*/,
                      }}
                      className="card-img-top"
                    />
                  ) : null}
                </figure>
                <div className="text_row">
                  <h3>
                    <span>{getName(nft)}</span>
                  </h3>
                </div>
                <div className="text_row">
                  <h3>
                    <span>ID: {getAssetId(nft)}</span>
                  </h3>
                </div>
                <div className="text_row">
                  <h3>
                    <span> Collection: {getCollectionName(nft)}</span>
                  </h3>
                </div>
                <div className="text_row">
                  <h3>
                    <span>
                      Author:{" "}
                      <Link to={`/account/${getAuthor(nft)}`}>
                        {getAuthor(nft)}
                      </Link>
                    </span>
                  </h3>
                </div>
              </div>
            ))}
          </div>
          {page + 1 <= pageCount ? (
            <div style={{ textAlign: "center" }}>
              <a
                href="#"
                className="more_btn"
                onClick={(e) => {
                  e.preventDefault();
                  handlePageClick(page + 1);
                }}
              >
                view more
              </a>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
};

export default NftAssets;
