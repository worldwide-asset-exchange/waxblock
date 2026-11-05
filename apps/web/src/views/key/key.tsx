import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import BlockchainApiManager from "../../app/services/blockchainApiManager";
import Skeleton from "react-loading-skeleton";
import { Link, useParams } from "react-router";

const Key = () => {
  const params = useParams();

  const {
    isLoading,
    error,
    data: keyAccounts,
  } = useQuery({
    queryKey: [`key_accounts`, params.key],
    queryFn: () => BlockchainApiManager.getKeyAccounts(params.key),
    suspense: false,
  });

  if (!params.key) {
    return <h2>No Account found</h2>;
  }

  return (
    <>
      <Helmet>
        <title>Key | WAX Explorer</title>
      </Helmet>

      <div className="block_detail_sec">
        <div className="cont_sec tab_sec">
          <h2>WAX Accounts</h2>
          <p>Key: {params.key}</p>

          <table>
            <tbody>
              {isLoading ? <Skeleton /> : null}
              {!isLoading && (error || !keyAccounts?.account_names?.length) ? (
                <tr>
                  <td>No Accounts found</td>
                </tr>
              ) : null}
              {keyAccounts?.account_names &&
                keyAccounts.account_names.map((account_name, index) => (
                  <tr key={index}>
                    <td>
                      <Link to={`/account/${account_name}`}>
                        {account_name}
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Key;
