import { Helmet } from "react-helmet-async";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import { useQuery } from "@tanstack/react-query";
import Skeleton from "react-loading-skeleton";
import protocolFeatures from "../../data/protocol-features.json";
import { Link } from "react-router";

const ProtocolFeatures = () => {
  const { data: activatedProtocolFeatures } = useQuery({
    queryKey: [`activated_protocol_features`],
    queryFn: () => BlockchainApiManager.getActivatedProtocolFeatures(),
  });

  return (
    <>
      <Helmet>
        <title>Protocol Features | WAX Explorer</title>
      </Helmet>
      <div>
        {/*Tabbing Sec*/}
        <div className="cont_sec tab_sec block_detail">
          <h2>
            Activated Protocol Features (
            {activatedProtocolFeatures &&
            activatedProtocolFeatures.activated_protocol_features
              ? activatedProtocolFeatures.activated_protocol_features.length
              : 0}
            )
          </h2>
          <ul className="tabbbing" />
          <div className="tab active">
            <table>
              <tbody>
                <tr>
                  <th>Activation Block</th>
                  <th>Feature</th>
                  <th>Feature Description</th>
                </tr>
                {activatedProtocolFeatures &&
                activatedProtocolFeatures.activated_protocol_features ? (
                  <>
                    {activatedProtocolFeatures.activated_protocol_features
                      .reverse()
                      .map((activatedProtocolFeature, index) => {
                        return (
                          <tr key={index}>
                            <td>
                              <Link
                                to={`/block/${activatedProtocolFeature.activation_block_num}`}
                              >
                                {activatedProtocolFeature.activation_block_num.toLocaleString(
                                  undefined,
                                  {},
                                )}
                              </Link>
                            </td>
                            <td>
                              {protocolFeatures[
                                activatedProtocolFeature.specification[0].value
                              ]?.link ? (
                                <a
                                  href={`${
                                    protocolFeatures[
                                      activatedProtocolFeature.specification[0]
                                        .value
                                    ]?.link
                                  }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {
                                    activatedProtocolFeature.specification[0]
                                      .value
                                  }
                                </a>
                              ) : (
                                <>
                                  {
                                    activatedProtocolFeature.specification[0]
                                      .value
                                  }
                                </>
                              )}

                              <span className="full_w">
                                {activatedProtocolFeature.feature_digest}
                              </span>
                            </td>
                            <td style={{ whiteSpace: "break-spaces" }}>
                              {
                                protocolFeatures[
                                  activatedProtocolFeature.specification[0]
                                    .value
                                ]?.description
                              }
                            </td>
                          </tr>
                        );
                      })}
                  </>
                ) : (
                  <>
                    {new Array(5).fill(0).map((log, index) => (
                      <tr key={index}>
                        <td>
                          <Skeleton />
                        </td>
                        <td>
                          <Skeleton />
                        </td>
                        <td>
                          <Skeleton />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/*Tabbing Sec*/}
        {/*Tabbing Sec*/}
        <div className="cont_sec tab_sec block_detail">
          <h2>Not Activated Protocol Features (2)</h2>
          <ul className="tabbbing" />
          <div className="tab active">
            <table>
              <tbody>
                <tr>
                  <th>Feature</th>
                  <th>Feature Description</th>
                </tr>
                <tr>
                  <td>KV_DATABASE</td>
                  <td>Enables usage of key-value database intrinsics</td>
                </tr>
                <tr>
                  <td>CONFIGURABLE_WASM_LIMITS</td>
                  <td>
                    Allows privileged contracts to set the constraints on
                    WebAssembly code
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {/*Tabbing Sec*/}
      </div>
    </>
  );
};

export default ProtocolFeatures;
