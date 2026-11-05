import { useCallback, useEffect, useMemo, useState } from "react";
import { createSearchParams, useNavigate, useSearchParams } from "react-router";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import AutocompleteInput, {
  AutocompleteItem,
} from "../../../app/components/ui/AutocompleteInput";

const ContractTables = ({ accountAbi }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tableParams, setTableParams] = useState(() => ({
    code: searchParams.get("code") || accountAbi.account_name,
    scope: searchParams.get("scope") || accountAbi.account_name,
    table:
      searchParams.get("table") || accountAbi.abi.tables[0]?.name,
    lower_bound: searchParams.get("lower_bound") || "",
    upper_bound: searchParams.get("upper_bound") || "",
    limit: searchParams.get("limit") || 10,
    reverse: false,
  }));
  const [tableRows, setTableRows] = useState({});

  const activeTable = useMemo(() => {
    const table = accountAbi.abi.tables.find(
      (table) => table.name === tableParams.table,
    );
    return table ?? (accountAbi.abi.tables[0] ? accountAbi.abi.tables[0] : null);
  }, [accountAbi, tableParams.table]);

  const loadTableRows = useCallback(
    (more = false, nextKey = "") => {
      navigate(
        {
          search: `?${createSearchParams(tableParams).toString()}`,
          hash: "contract-tables",
        },
        { replace: true },
      );

      BlockchainApiManager.getTableRows({
        ...tableParams,
        lower_bound: more ? nextKey : tableParams.lower_bound,
      }).then((results) => {
        if (more) {
          setTableRows((currentRows) => ({
            more: results.more,
            next_key: results.next_key,
            rows: [...currentRows.rows, ...results.rows],
          }));
        } else {
          setTableRows(results);
        }
      });
    },
    [navigate, tableParams],
  );

  useEffect(() => {
    loadTableRows();
  }, [tableParams.table, loadTableRows]);

  const [items, setItems] = useState<AutocompleteItem[]>([]);

  useEffect(() => {
    //if (tableParams.scope === "") return;

    const search_scope = tableParams.scope.toLowerCase();

    const timeoutId = setTimeout(() => {
      BlockchainApiManager.getTableByScope({
        code: tableParams.code,
        table: tableParams.table,
        lower_bound: search_scope,
        upper_bound: search_scope.padEnd(12, "z"),
        limit: 10,
      }).then((res) => {
        setItems(res.rows.map((row) => ({ value: row.scope })));
      });
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [tableParams.code, tableParams.scope, tableParams.table]);

  return (
    <>
      <h3>Select Table</h3>
      {accountAbi.abi.tables.map((table, index) => (
        <a
          className={`more_btn ${
            activeTable?.name === table.name ? "active" : ""
          }`}
          style={{
            marginBottom: "10px",
            padding: "10px",
            width: "auto",
            cursor: "pointer",
            marginRight: "10px",
            fontSize: "12px",
            lineHeight: "14px",
            background:
              activeTable?.name === table.name ? "#7D70F6" : "#404047",
            textTransform: "none",
          }}
          key={index}
          onClick={() => {
            setTableParams({
              ...tableParams,
              table: table.name,
              scope: accountAbi.account_name,
            });
          }}
        >
          {table.name}
        </a>
      ))}
      <div className="mid_sec">
        <div className="form_sec" style={{ width: "100%" }}>
          <div className="form_box active">
            <h3>Enter Parameters</h3>
            <form>
              <div className="field_row">
                <div className="field_col">
                  <label>Scope</label>
                  <AutocompleteInput
                    id="dropdownContractTablesScopeSearch"
                    name="dropdownContractTablesScopeSearch"
                    placeholder="Scope"
                    value={tableParams.scope}
                    items={items}
                    defaultItems={[{ value: accountAbi.account_name }]}
                    showDefaultItems
                    onValueChange={(value) =>
                      setTableParams({
                        ...tableParams,
                        scope: value,
                      })
                    }
                    onSelect={(item) =>
                      setTableParams({
                        ...tableParams,
                        scope: item.value,
                      })
                    }
                  />
                </div>
                <div className="field_col">
                  <label>Lower Bound</label>
                  <input
                    type="text"
                    placeholder="Lower Bound"
                    value={tableParams.lower_bound}
                    onChange={(event) =>
                      setTableParams({
                        ...tableParams,
                        lower_bound: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="field_row">
                <div className="field_col">
                  <label>Upper Bound</label>
                  <input
                    type="text"
                    placeholder="Upper Bound"
                    value={tableParams.upper_bound}
                    onChange={(event) =>
                      setTableParams({
                        ...tableParams,
                        upper_bound: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="field_col">
                  <label>Limit</label>
                  <input
                    type="text"
                    placeholder="Limit"
                    value={tableParams.limit}
                    onChange={(event) =>
                      setTableParams({
                        ...tableParams,
                        limit: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="field_row">
                <div className="field_col">
                  <div
                    className="checkbox"
                    //style={{ display: "inline-flex" }}
                  >
                    <input
                      type="checkbox"
                      name="transfer"
                      className="check_input"
                      id="reverse-table-order"
                      //style={{ marginTop: "-10px" }}
                      checked={tableParams.reverse}
                      onChange={() =>
                        setTableParams({
                          ...tableParams,
                          reverse: !tableParams.reverse,
                        })
                      }
                    />
                    &nbsp;
                    <label
                      className="check_label"
                      htmlFor="reverse-table-order"
                      style={{ cursor: "pointer" }}
                    >
                      Reverse
                    </label>
                  </div>
                </div>
              </div>
              <div className="field_row">
                <div className="field_col">
                  <input
                    type="button"
                    value="Refresh"
                    onClick={() => loadTableRows()}
                  />
                </div>
              </div>
            </form>
            <h3>Table Result</h3>
            {tableRows && tableRows.rows && tableRows.rows.length ? (
              <>
                <div className="table-wrapper" style={{ overflowX: "auto" }}>
                  <table className="large">
                    <thead>
                      <tr>
                        <th>#</th>
                        {Object.keys(tableRows.rows[0]).map(
                          (header, headerIndex) => (
                            <th key={headerIndex}>{header}</th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td>{rowIndex + 1}</td>
                          {Object.keys(row).map((rowKey, rowKeyIndex) => (
                            <td key={rowKeyIndex}>
                              {typeof row[rowKey] === "object"
                                ? JSON.stringify(row[rowKey])
                                : row[rowKey]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tableRows.more ? (
                  <div style={{ textAlign: "center", marginTop: "10px" }}>
                    <a
                      href="#"
                      className="more_btn"
                      onClick={(e) => {
                        e.preventDefault();
                        loadTableRows(true, tableRows.next_key);
                      }}
                    >
                      view more
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <p>No Data</p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContractTables;
