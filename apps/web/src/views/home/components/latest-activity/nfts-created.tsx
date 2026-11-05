import { numberFormat } from "../../../../app/utilities/format";

const NftsCreated = ({ statistics }) => {
  const DEFAULT = 461118992;
  const renderNumberAssets = () => {
    if (
      statistics &&
      statistics.atomicassets &&
      parseFloat(statistics.atomicassets) > DEFAULT
    ) {
      return numberFormat(statistics.atomicassets.assets_count);
    }

    return numberFormat(DEFAULT);
  };

  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">NFTs created</span>
          <span className="value">{renderNumberAssets()}</span>
        </div>
      </div>
    </>
  );
};

export default NftsCreated;
