import { useState } from "react";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";

const DownloadTransfersContent = ({ account_name }) => {
  const [downloader, setDownloader] = useState({
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const downloadTransfers = async () => {
    setDownloader((downloader) => ({
      ...downloader,
      isLoading: true,
      isError: false,
      isSuccess: false,
    }));

    try {
      let actions = [];
      let more = 0;
      const maxTransfers = 5000;
      let currentPage = 1;
      let nextPage;
      const params = {};
      params.limit = 500;
      params.skip = 0;
      params.sort = "desc";
      params.filter = [];
      params.filter.push("eosio.token:transfer");
      params.filter = params.filter.join(",");
      do {
        const results = await BlockchainApiManager.getV2Actions(
          account_name,
          params,
        );

        more = 0;
        if (results) {
          if (results.actions) {
            actions = [...actions, ...results.actions];
          }

          // params.skip = params.skip + 1;

          // const currentPage = params.skip;
          // const nextPage = params.skip + 1;

          params.skip = params.skip + params.limit;

          currentPage = currentPage + 1;
          nextPage = currentPage + 1;

          if (
            results.total.value > currentPage * params.limit &&
            nextPage * params.limit <= maxTransfers
          ) {
            more = 1;
          }
        }
      } while (more === 1);

      const csvOut = generateCsv(actions);

      const filename = [account_name, "_transfers", ".csv"].join("");
      download(csvOut, filename, "text/csv;encoding:utf-8");
      setDownloader((downloader) => ({ ...downloader, isSuccess: true }));
    } catch {
      setDownloader((downloader) => ({ ...downloader, isError: true }));
    }

    setDownloader((downloader) => ({ ...downloader, isLoading: false }));
  };

  const generateCsv = (actions) => {
    const csvHeaders = ["Datetime", "Sender", "Receiver", "WAX Amount", "Memo"];
    const csvData = [];
    actions.forEach((action) => {
      const datetime = action.timestamp;
      const sender = action.act.data.from;
      const receiver = action.act.data.to;
      const amount = action.act.data.amount;
      const memo = action.act.data.memo;
      csvData.push([datetime, sender, receiver, amount, memo]);
    });

    let csvOut = csvHeaders.map((rec) => `"${rec}"`).join(",") + "\n";
    csvData.forEach(function (row) {
      csvOut += row.map((rec) => `"${rec}"`).join(",");
      csvOut += "\n";
    });

    return csvOut;
  };

  const download = (content, fileName, mimeType) => {
    const a = document.createElement("a");
    mimeType = mimeType || "application/octet-stream";

    if (navigator.msSaveBlob) {
      // IE10
      navigator.msSaveBlob(
        new Blob([content], {
          type: mimeType,
        }),
        fileName,
      );
    } else if (URL && "download" in a) {
      //html5 A[download]
      a.href = URL.createObjectURL(
        new Blob([content], {
          type: mimeType,
        }),
      );
      a.setAttribute("download", fileName);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.location.href =
        "data:application/octet-stream," + encodeURIComponent(content); // only this mime type is supported
    }
  };

  return (
    <>
      <div className="widget">
        <div className="widget_inner">
          <span className="type">DOWNLOAD WAX TRANSACTIONS</span>
          <p>
            Download a CSV file containing all WAX transfers for this account.
            Service limits to maximum last 5,000 WAX transfers.
          </p>

          {downloader.isError ? (
            <p style={{ color: "red" }}>
              Sorry, there was an error. Please try again later.
            </p>
          ) : null}
          {downloader.isSuccess ? (
            <p style={{ color: "green" }}>
              Completed CSV download successfully!
            </p>
          ) : null}

          {downloader.isLoading ? (
            <a className="link_out" rel="nofollow">
              Preparing CSV for download, please wait...
            </a>
          ) : null}

          {!downloader.isLoading ? (
            <a
              href="#"
              className="link_out"
              rel="nofollow"
              onClick={(e) => {
                e.preventDefault();
                downloadTransfers();
              }}
            >
              DOWNLOAD CSV
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
};

const DownloadTransfers = ({ account_name }) => (
  <DownloadTransfersContent key={account_name} account_name={account_name} />
);

export default DownloadTransfers;
