import Skeleton from "react-loading-skeleton";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import { getShortTrxId } from "../../../app/utilities/transaction";
import React from "react";
import DisplayActionData from "../../../app/components/blockchain/action/display-action-data";
import { momentformat, unixSeconds } from "../../../app/utilities/date";
import { useEffect } from "react";
import { useState } from "react";
import {
  decrementDecimalString,
  getV2ActionSearchText,
  getV2ActionsPageRequest,
  HYPERION_WINDOW_BOUNDARY_SKIP,
  isV2ActionAllowedBySpamFilter,
  isV2SmallIncomingTransfer,
} from "../../../app/services/historyAdapters";
import DateRangeFilter from "../../../app/components/ui/DateRangeFilter";
import Pagination from "../../../app/components/ui/Pagination";
import Icon from "../../../app/components/ui/Icon";

const REVERSIBLE_WINDOW_MS = 3 * 60 * 1000;

const getActionsQueryKey = (accountName, filters) =>
  JSON.stringify({
    accountName,
    actions: filters.actions,
    contract: filters.contract,
    date: filters.date,
    token: filters.token,
  });

const getPageFromSearchParams = (searchParams: URLSearchParams) => {
  const queryPage = Number.parseInt(searchParams.get("page") || "1", 10);
  return Number.isInteger(queryPage) && queryPage > 0 ? queryPage - 1 : 0;
};

const Transactions = ({ balances }) => {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = {
    hideSmallTransfers: false,
    hideSpam: true,
    date: { start: null, end: null },
    actions: {
      receive_token: false,
      send_token: false,
      contract: false,
      account: false,
      resource: false,
      producer: false,
      vote: false,
    },
    token: null,
    token_search: "",
    token_balance: null,
    contract: { code: null, action: null },
    search: "",
  };

  const initialSettings = {
    smallTransfersThreshold: 0.001,
    spamActions: [],
    datesInUtc: false,
  };

  const [filters, setFilters] = useState(initialFilters);
  const [contractInput, setContractInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [tokenFilterOpen, setTokenFilterOpen] = useState(false);

  const [settings, setSettings] = useState(initialSettings);
  const [reversibleAfter, setReversibleAfter] = useState(
    () => Date.now() - REVERSIBLE_WINDOW_MS,
  );

  useEffect(() => {
    const updateReversibleAfter = () =>
      setReversibleAfter(Date.now() - REVERSIBLE_WINDOW_MS);
    const intervalId = setInterval(updateReversibleAfter, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  //const [currentItems, setCurrentItems] = useState([]);
  const totalForQueryRef = React.useRef(0);
  const [stableTotalItems, setStableTotalItems] = useState(0);

  const itemsPerPage = 100;
  const pageFromSearchParams = getPageFromSearchParams(searchParams);
  const page = pageFromSearchParams;
  const filterResetKey = JSON.stringify({
    account: params.account,
    actions: filters.actions,
    contract: filters.contract,
    date: filters.date,
    token: filters.token,
  });
  const actionWindowCache = React.useRef({
    queryKey: "",
    upperBounds: new Map(),
  });
  const previousFilterResetKey = React.useRef(filterResetKey);
  const searchParamsRef = React.useRef(searchParams);
  //const [itemOffset, setItemOffset] = useState(0);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const updatePageSearchParam = React.useCallback(
    (nextPage) => {
      const nextParams = new URLSearchParams(searchParamsRef.current);

      if (nextPage <= 0) {
        nextParams.delete("page");
      } else {
        nextParams.set("page", String(nextPage + 1));
      }

      setSearchParams(nextParams);
    },
    [setSearchParams],
  );

  const applyFilters = React.useCallback(() => {
    //setCurrentItems([]);
    totalForQueryRef.current = 0;
    setStableTotalItems(0);
    updatePageSearchParam(0);
    actionWindowCache.current = {
      queryKey: "",
      upperBounds: new Map(),
    };
  }, [updatePageSearchParam]);

  const actionsQueryKey = getActionsQueryKey(params.account, filters);

  const buildActionQueryParams = (
    baseParams: Record<string, string | number | boolean>,
  ) => {
    const queryParams: Record<string, string | number | boolean> = {
      sort: "desc",
      track: true,
      ...baseParams,
    };

    if (filters.date.start) {
      queryParams.after = filters.date.start;
    }
    if (filters.date.end) {
      queryParams.before = filters.date.end;
    }

    const actionFilters = [];

    if (filters.actions.receive_token) {
      queryParams["transfer.to"] = params.account;
    }
    if (filters.actions.send_token) {
      queryParams["transfer.from"] = params.account;
    }
    if (filters.actions.contract) {
      actionFilters.push("eosio:setcode,eosio:setabi");
    }
    if (filters.actions.account) {
      actionFilters.push(
        "eosio:newaccount,eosio.msig:approve,eosio.msig:propose,eosio.msig:cancel,eosio.msig:exec,eosio:linkauth,eosio:unlinkauth,eosio:updateauth,eosio:deleteauth",
      );
    }
    if (filters.actions.resource) {
      actionFilters.push(
        "eosio:delegatebw,eosio:undelegatebw,eosio:buyrambytes,eosio:sellrambytes,eosio:sellram,eosio:buyram",
      );
    }
    if (filters.actions.producer) {
      actionFilters.push(
        "eosio:claimrewards,eosio:regproducer,eosio:unregprod",
      );
    }
    if (filters.actions.vote) {
      actionFilters.push("eosio:voteproducer,eosio:vote,eosio:unvote");
    }
    if (filters.token && filters.token !== "all") {
      actionFilters.push(`${filters.token}:*`);
    }
    if (filters.contract.code || filters.contract.action) {
      actionFilters.push(
        `${filters.contract.code || "*"}:${filters.contract.action || "*"}`,
      );
    }

    if (actionFilters.length > 0) {
      queryParams.filter = actionFilters.join(",");
    }

    return queryParams;
  };

  const getActionWindowUpperBound = async (targetWindow: number) => {
    if (targetWindow <= 0) {
      return null;
    }

    if (actionWindowCache.current.queryKey !== actionsQueryKey) {
      actionWindowCache.current = {
        queryKey: actionsQueryKey,
        upperBounds: new Map(),
      };
    }

    for (let window = 1; window <= targetWindow; window += 1) {
      if (actionWindowCache.current.upperBounds.has(window)) {
        continue;
      }

      const previousUpperBound =
        window === 1
          ? null
          : actionWindowCache.current.upperBounds.get(window - 1);

      if (window > 1 && !previousUpperBound) {
        return null;
      }

      const queryParams = buildActionQueryParams({
        limit: 1,
        skip: HYPERION_WINDOW_BOUNDARY_SKIP,
        track: true,
      });

      if (previousUpperBound) {
        queryParams.global_sequence = `0-${previousUpperBound}`;
      }

      const results = await BlockchainApiManager.getV2Actions(
        params.account,
        queryParams,
      );
      const boundaryAction = results.actions?.[0];
      if (!boundaryAction) {
        return null;
      }

      const nextUpperBound = decrementDecimalString(
        String(boundaryAction.global_sequence),
      );
      if (!nextUpperBound) {
        return null;
      }

      actionWindowCache.current.upperBounds.set(window, nextUpperBound);
    }

    return actionWindowCache.current.upperBounds.get(targetWindow) || null;
  };

  const {
    refetch,
    isPending,
    data: actions,
  } = useQuery({
    queryKey: [
      `actions`,
      params.account,
      filters.actions,
      filters.contract,
      filters.date,
      filters.token,
      page,
    ],

    queryFn: async () => {
      let resolvedTotal = totalForQueryRef.current || null;

      if (resolvedTotal === null && page > 0) {
        const totalResults = await BlockchainApiManager.getV2Actions(
          params.account,
          buildActionQueryParams({
            limit: 1,
            skip: 0,
            track: true,
          }),
        );

        resolvedTotal = totalResults.total?.value || 0;
        totalForQueryRef.current = resolvedTotal;
      }

      const pageRequest = getV2ActionsPageRequest({
        page,
        itemsPerPage,
        totalResults: resolvedTotal,
        after: filters.date.start,
        before: filters.date.end,
      });

      if (!pageRequest) {
        return {
          actions: [],
          total: { value: resolvedTotal || totalForQueryRef.current },
          totalValue: resolvedTotal,
          readsFullTotal: true,
        };
      }

      const queryParams = buildActionQueryParams({
        limit: pageRequest.limit,
        skip: pageRequest.skip,
        sort: pageRequest.sort,
        track: true,
      });

      if (pageRequest.after) {
        queryParams.after = pageRequest.after;
      }

      if (pageRequest.kind === "window") {
        const globalSequenceMax = await getActionWindowUpperBound(
          pageRequest.windowIndex || 0,
        );

        if (!globalSequenceMax) {
          return {
            actions: [],
            total: { value: resolvedTotal || totalForQueryRef.current },
            totalValue: resolvedTotal,
            readsFullTotal: false,
          };
        }

        queryParams.global_sequence = `0-${globalSequenceMax}`;
      }

      const results = await BlockchainApiManager.getV2Actions(
        params.account,
        queryParams,
      );

      const totalValue = resolvedTotal ?? results.total?.value;
      if (typeof totalValue === "number") {
        totalForQueryRef.current = totalValue;
      }

      return {
        ...results,
        actions: pageRequest.reverseResults
          ? [...(results.actions || [])].reverse()
          : results.actions || [],
        totalValue,
        readsFullTotal: pageRequest.readsFullTotal,
      };
    },
  });

  const totalCount = actions?.totalValue ?? actions?.total?.value;
  if (typeof totalCount === "number" && totalCount !== stableTotalItems) {
    setStableTotalItems(totalCount);
  }
  const totalItems =
    typeof totalCount === "number" ? totalCount : stableTotalItems;
  const pageCount = Math.ceil(totalItems / itemsPerPage);

  const handlePageClick = (event) => {
    //setCurrentItems([]);
    updatePageSearchParam(event.selected);

    //const newOffset = ((page - 1) * itemsPerPage) % proxies.length;

    //setItemOffset(newOffset);
  };

  const sortAction = (rowA, rowB) => {
    return (
      unixSeconds(rowB.timestamp || rowB["@timestamp"]) -
      unixSeconds(rowA.timestamp || rowA["@timestamp"])
    );
  };

  const filterAction = (action) => {
    //Search
    if (filters.search) {
      const text = getV2ActionSearchText(action);

      if (text.toLowerCase().indexOf(filters.search.toLowerCase()) === -1) {
        return false;
      }
    }
    //Small transfers check
    if (filters.hideSmallTransfers) {
      if (
        isV2SmallIncomingTransfer(
          action,
          params.account,
          settings.smallTransfersThreshold,
        )
      ) {
        return false;
      }
    }

    //Spam check
    if (filters.hideSpam) {
      if (
        !isV2ActionAllowedBySpamFilter(
          action,
          params.account,
          settings.spamActions,
        )
      ) {
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    if (previousFilterResetKey.current === filterResetKey) {
      return;
    }

    previousFilterResetKey.current = filterResetKey;
    applyFilters();
  }, [applyFilters, filterResetKey]);

  const resetFilters = (e) => {
    e.preventDefault();
    setFilters(initialFilters);
    setSettings(initialSettings);
    setContractInput("");
    setActionInput("");
  };

  const refreshActions = (e) => {
    e.preventDefault();
    refetch();
  };

  return (
    <>
      <div className="filter_sec">
        <ul className="extra_btns">
          <li>
            <a
              data-tip="Reset Filters"
              href="#"
              className="reset_btn"
              onClick={resetFilters}
            >
              <Icon name="x" />
            </a>
          </li>
          <li>
            <a
              data-tip="Refresh Actions"
              href="#"
              className="refresh_btn"
              onClick={refreshActions}
            >
              <Icon name="refresh" />
            </a>
          </li>
        </ul>
        <div className="filter_row">
          <div className="filter_box">
            <h4>
              Category Action Filter:{" "}
              <span data-tip="Filters entire history for category type.">
                <Icon name="info" />
              </span>
            </h4>
            <div className="cat_btns">
              <input
                type="button"
                defaultValue="Receive Token"
                className={`${filters.actions.receive_token ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      receive_token: !filters.actions.receive_token,
                      send_token: false,
                      contract: false,
                      account: false,
                      resource: false,
                      producer: false,
                      vote: false,
                    },
                  }));
                }}
              />
              <input
                type="button"
                defaultValue="Send Token"
                className={`${filters.actions.send_token ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      send_token: !filters.actions.send_token,
                      receive_token: false,
                      contract: false,
                      account: false,
                      resource: false,
                      producer: false,
                      vote: false,
                    },
                  }));
                }}
              />
              <input
                type="button"
                defaultValue="Contract"
                className={`${filters.actions.contract ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      ...filters.actions,
                      receive_token: false,
                      send_token: false,
                      contract: !filters.actions.contract,
                    },
                  }));
                }}
              />
              <input
                type="button"
                defaultValue="Account"
                className={`${filters.actions.account ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      ...filters.actions,
                      receive_token: false,
                      send_token: false,
                      account: !filters.actions.account,
                    },
                  }));
                }}
              />
              <input
                type="button"
                defaultValue="RAM / CPU / NET"
                className={`${filters.actions.resource ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      ...filters.actions,
                      receive_token: false,
                      send_token: false,
                      resource: !filters.actions.resource,
                    },
                  }));
                }}
              />
              <input
                type="button"
                defaultValue="Producer"
                className={`${filters.actions.producer ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      ...filters.actions,
                      receive_token: false,
                      send_token: false,
                      producer: !filters.actions.producer,
                    },
                  }));
                }}
              />
              <input
                type="button"
                defaultValue="Vote"
                className={`${filters.actions.vote ? "active" : ""}`}
                onClick={() => {
                  setFilters((filters) => ({
                    ...filters,
                    actions: {
                      ...filters.actions,
                      receive_token: false,
                      send_token: false,
                      vote: !filters.actions.vote,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="filter_box">
            <h4>
              Contract/Action Filter:{" "}
              <span data-tip="Filters entire history for contract and/or action.">
                <Icon name="info" />
              </span>
            </h4>
            <div className="cont_filter">
              <input
                type="text"
                name="contract_code"
                placeholder="Contract name"
                value={contractInput}
                onChange={(el) => {
                  setContractInput(el.target.value.toLowerCase());
                }}
              />
              <input
                type="text"
                name="contract_action"
                placeholder="Action name"
                value={actionInput}
                onChange={(el) => {
                  setActionInput(el.target.value.toLowerCase());
                }}
              />
              <input
                type="button"
                defaultValue="Filter"
                onClick={() => {
                  //applyFilters();
                  setFilters((filters) => ({
                    ...filters,
                    contract: {
                      ...filters.contract,
                      code: contractInput,
                      action: actionInput,
                    },
                  }));
                }}
              />
            </div>
          </div>
          <div className="filter_box">
            <h4>
              Date Filter:{" "}
              <span data-tip="Filters action by date range.">
                <Icon name="info" />
              </span>
            </h4>
            <div className="date_filter">
              <DateRangeFilter
                value={filters.date}
                onChange={(date) =>
                  setFilters((filters) => ({
                    ...filters,
                    date,
                  }))
                }
              />
            </div>
          </div>
          <div className="filter_box">
            <h4>
              Token Filter:{" "}
              <span data-tip="Filters entire history for token actions.">
                <Icon name="info" />
              </span>
            </h4>
            <div className="token_filter">
              <button
                type="button"
                className="search_token_btn"
                onClick={() => setTokenFilterOpen((open) => !open)}
              >
                <Icon name="filter" />
                {!filters.token_balance
                  ? "All Tokens"
                  : `${filters.token_balance.currency} ${filters.token_balance.contract}`}
              </button>
              <div className={`search_box ${tokenFilterOpen ? "active" : ""}`}>
                <div className="autocomplete" style={{ width: "100%" }}>
                  <input
                    id="tokenInput"
                    type="text"
                    name="id"
                    autoComplete="off"
                    value={filters.token_search}
                    onChange={(e) => {
                      setFilters((filters) => ({
                        ...filters,
                        token_search: e.target.value.toLowerCase(),
                      }));
                    }}
                  />
                  <div className="autocomplete-items">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        setFilters((filters) => ({
                          ...filters,
                          token: "all",
                          token_balance: null,
                        }));
                        setTokenFilterOpen(false);
                      }}
                    >
                      <a href="#">All Tokens</a>
                    </div>
                    {balances &&
                      balances.balances &&
                      [...balances.balances]
                        .sort((a, b) => (a.currency > b.currency ? 1 : -1))
                        //.filter((balance) => balance.amount > 0)
                        .filter((balance) => {
                          if (
                            [" ", balance.currency, balance.contract]
                              .join(" ")
                              .toLowerCase()
                              .indexOf(filters.token_search.toLowerCase()) ===
                            -1
                          ) {
                            return false;
                          }
                          return true;
                        })
                        .map((balance, index) => (
                          <div
                            key={index}
                            onClick={(e) => {
                              e.preventDefault();
                              setFilters((filters) => ({
                                ...filters,
                                token: balance.contract,
                                token_balance: balance,
                              }));
                              setTokenFilterOpen(false);
                            }}
                          >
                            <a href="#">
                              {balance.currency} {balance.contract}
                            </a>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="filter_box">
            <h4>
              Action Settings:{" "}
              <span
                data-tip={`Hide small balances: Less than ${settings.smallTransfersThreshold}.`}
              >
                <Icon name="info" />
              </span>
            </h4>
            <div className="action_settings">
              <div className="checkbox">
                <input
                  type="checkbox"
                  className="check_input"
                  id="dates-in-utc"
                  checked={settings.datesInUtc}
                  onChange={(el) => {
                    setSettings({
                      ...settings,
                      datesInUtc: el.target.checked,
                    });
                  }}
                />
                <label className="check_label" htmlFor="dates-in-utc">
                  Dates in UTC
                </label>
              </div>
              <div className="checkbox">
                <input
                  type="checkbox"
                  className="check_input"
                  id="hide-small-balances"
                  checked={filters.hideSmallTransfers}
                  onChange={(el) => {
                    setFilters((filters) => ({
                      ...filters,
                      hideSmallTransfers: el.target.checked,
                    }));
                  }}
                />
                <label className="check_label" htmlFor="hide-small-balances">
                  Hide Small Balances
                </label>
              </div>
              <div className="checkbox">
                <input
                  type="checkbox"
                  className="check_input"
                  id="hide-spam"
                  checked={filters.hideSpam}
                  onChange={(el) => {
                    setFilters((filters) => ({
                      ...filters,
                      hideSpam: el.target.checked,
                    }));
                  }}
                />
                <label className="check_label" htmlFor="hide-spam">
                  Hide Spam
                </label>
              </div>
            </div>
          </div>
          <div className="filter_box">
            <div className="memo">
              <input
                type="search"
                placeholder="Search ..."
                aria-label="Search"
                value={filters.search}
                onChange={(el) => {
                  setFilters((filters) => ({
                    ...filters,
                    search: el.target.value,
                  }));
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {pageCount > 0 ? (
        <Pagination
          onPageChange={(selected) => handlePageClick({ selected })}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          page={pageCount > 0 ? page : 0}
        />
      ) : null}

      <div className="table_row">
        <div className="table_row_inner">
          <table>
            <thead>
              <tr>
                <th style={{ width: "15%" }}>TX ID</th>
                <th style={{ width: "15%" }}>Date</th>
                <th style={{ width: "15%" }}>Action</th>
                <th style={{ width: "55%" }}>Data</th>
              </tr>
            </thead>
            <tbody>
              {isPending &&
                Array(5)
                  .fill(0)
                  .map((item, index) => (
                    <tr key={index}>
                      <td style={{ width: "15%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "15%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "15%" }}>
                        <Skeleton />
                      </td>
                      <td style={{ width: "55%" }}>
                        <Skeleton />
                      </td>
                    </tr>
                  ))}

              {!isPending &&
                actions &&
                actions.actions
                  .filter(filterAction)
                  .sort(sortAction)
                  .map((action, index) => (
                    <tr key={index}>
                      <td style={{ width: "15%" }}>
                        <Link to={`/transaction/${action.trx_id}`}>
                          {getShortTrxId(action.trx_id)}
                        </Link>
                        &nbsp;
                        {unixSeconds(action.timestamp || action["@timestamp"]) *
                          1000 >
                        reversibleAfter ? (
                          <span
                            className="tooltip"
                            data-tip="This is a reversible transaction since it has not been confirmed by at least 15/21 validators."
                          >
                            <Icon name="clock" color="#f2711c" />
                          </span>
                        ) : null}
                      </td>
                      <td style={{ width: "15%", whiteSpace: "nowrap" }}>
                        {momentformat(
                          action.timestamp || action["@timestamp"],
                          "MMM DD YYYY, HH:mm:ss",
                          settings.datesInUtc,
                        )}
                      </td>
                      <td style={{ width: "15%", whiteSpace: "nowrap" }}>
                        <Link to={`/account/${action.act.account}`}>
                          <span className="type">{action.act.account}</span>
                        </Link>
                        &nbsp;
                        <span className="type">{action.act.name}</span>
                      </td>
                      <td style={{ width: "55%" /*,wordBreak:'break-all'*/ }}>
                        <DisplayActionData
                          action={action.act}
                          account_name={params.account}
                        />
                      </td>
                    </tr>
                  ))}
              {!isPending &&
              actions &&
              actions.actions.filter(filterAction).sort(sortAction).length ===
                0 ? (
                <tr>
                  <td colSpan={4}>
                    No Actions Found (check filters or load more actions)
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {pageCount > 0 ? (
        <Pagination
          onPageChange={(selected) => handlePageClick({ selected })}
          pageRangeDisplayed={3}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          page={pageCount > 0 ? page : 0}
        />
      ) : null}
    </>
  );
};

export default Transactions;
