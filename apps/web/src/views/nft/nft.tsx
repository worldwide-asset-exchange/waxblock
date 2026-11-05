import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import ImageLoader from "../../app/components/image-loader";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import {
  getAssetId,
  getAuthor,
  getCollectionName,
  getImage,
  getImmutableData,
  getMutableData,
  getName,
  getOwner,
  getSchemaName,
  getTemplateId,
  getVideo,
  isBurnable,
  isTransferable,
} from "../../app/utilities/nft";

const Nft = () => {
  const params = useParams();

  const { isLoading, data: nft } = useQuery({
    queryKey: [`nft`, params.assetType, params.assetId],
    queryFn: () =>
      BlockchainApiManager.getNft(params.assetType, params.assetId),
  });

  // if (!nft) return "Loading...";
  if (!params.assetType || !params.assetId) {
    return <h2>No Nfts found</h2>;
  }

  return (
    <>
      <div className="row">
        <div className="col-md-2">
          {isLoading ? <Skeleton /> : null}

          {nft && getImage(nft) ? (
            <ImageLoader src={getImage(nft)} style={{ width: "150px" }} />
          ) : // <img src={getImage(nft)} alt="" style={{ width: "150px" }} onError={(e)=>{e.target.onerror = null; e.target.src="/no-image.png"}} />
          null}
          {nft && !getImage(nft) && getVideo(nft) ? (
            <video controls style={{ width: "150px" }}>
              <source src={getVideo(nft)} type="video/mp4" />
            </video>
          ) : null}
        </div>
        <div className="col-md-10">
          <h5 className="card-title">{getName(nft)}</h5>
          <ul>
            <li>Asset ID: {nft ? getAssetId(nft) : <Skeleton />}</li>
            <li>
              Owner:{" "}
              {nft ? (
                <Link to={`/account/${getOwner(nft)}`}>{getOwner(nft)}</Link>
              ) : (
                <Skeleton />
              )}
            </li>
            <li>
              Author:{" "}
              {nft ? (
                <Link to={`/account/${getAuthor(nft)}`}>{getAuthor(nft)}</Link>
              ) : (
                <Skeleton />
              )}
            </li>
            <li>Collection: {nft ? getCollectionName(nft) : <Skeleton />}</li>
            <li>Schema: {nft ? getSchemaName(nft) : <Skeleton />}</li>
            <li>Template ID: {nft ? getTemplateId(nft) : <Skeleton />}</li>
          </ul>
          {isTransferable ? (
            <span className="badge bg-warning">Transferrable</span>
          ) : null}
          {isBurnable ? (
            <span className="badge bg-danger">Burnable</span>
          ) : null}
        </div>
      </div>
      <div className="row">
        {nft && getImmutableData(nft) ? (
          <div className="col-md-6">
            <h5>Immutable Properties</h5>
            <table>
              <tbody>
                {nft &&
                  getImmutableData(nft) &&
                  Object.keys(getImmutableData(nft)).map((idataKey, index) => (
                    <tr key={index}>
                      <td>{idataKey}</td>
                      <td>{getImmutableData(nft)[idataKey]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {nft && getMutableData(nft) ? (
          <div className="col-md-6">
            <h5>Mutable Properties</h5>
            <table>
              <tbody>
                {nft &&
                  getMutableData(nft) &&
                  Object.keys(getMutableData(nft)).map((mdataKey, index) => (
                    <tr key={index}>
                      <td>{mdataKey}</td>
                      <td>{getMutableData(nft)[mdataKey]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Nft;
