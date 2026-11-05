import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import Icon from "../../../../app/components/ui/Icon";
import ApiManager from "../../../../app/services/apiManager";

import Highcharts from "../../../../app/utilities/highcharts";
import { HighchartsReact } from "highcharts-react-official";
import "highcharts/highcharts-3d";
import Skeleton from "react-loading-skeleton";

const TopHolders = ({ token, supply }) => {
  const params = useParams();

  const { data: topHolders } = useQuery({
    queryKey: [`tokens_topHolders`, params.key],
    queryFn: () => ApiManager.getTokenTopHolders(params.key),
  });

  const seriesData = useMemo(() => {
    if (!token || !topHolders || !supply) return [];

    const data = [];
    topHolders?.map((holder, key) => {
      if (key <= 100) {
        const percentage = parseFloat(
          (
            (holder[1] /
              (token?.supply?.circulating || parseFloat(supply?.supply))) *
            100
          ).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          }),
        );
        if (key === 0) {
          data.push({
            name: holder[0],
            y: percentage,
            selected: true,
            sliced: true,
          });
        } else {
          data.push({ name: holder[0], y: percentage });
        }
      }
    });

    return data;
  }, [token, topHolders, supply]);

  const options = {
    chart: {
      type: "pie",
      options3d: {
        enabled: true,
        alpha: 45,
      },
      styledMode: false,
      allowPointSelect: true,
      height: 350,
      backgroundColor: "transparent",
    },
    title: {
      text: "",
    },
    accessibility: {
      description:
        "Three-dimensional pie chart showing the distribution of token holdings among the top holders.",
    },
    subtitle: {
      text: "",
    },
    exporting: false,
    credits: {
      enabled: false,
    },
    tooltip: {
      hideDelay: 3000,
      useHTML: true,
      followPointer: false,
      style: {
        padding: 0,
        pointerEvents: "auto",
      },
      formatter: function () {
        let ret =
          '<a href="/account/' +
          this.point.name +
          '" style="color:inherit"><b>' +
          this.point.name +
          "</b></a><br>";
        ret +=
          '<span style="color:' +
          this.point.color +
          '">\u25CF</span> ' +
          this.series.name +
          ": ";
        ret += "<b>" + Highcharts.numberFormat(this.point.y, 2) + "</b>";
        return ret;
      },
    },
    plotOptions: {
      pie: {
        innerSize: 110,
        depth: 50,
        allowPointSelect: true,
        cursor: "pointer",
        size: "100%",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y:,.2f} %",
          style: {
            color:
              (Highcharts.theme as { contrastTextColor?: string } | undefined)
                ?.contrastTextColor ?? "black",
          },
        },
      },
    },
    series: [
      {
        colorByPoint: true,
        name: "Tokens",
        data: seriesData,
      },
    ],
  };

  return (
    <>
      <div className="top_holders">
        {token && topHolders && supply ? (
          <HighchartsReact highcharts={Highcharts} options={options} />
        ) : token ? (
          <Skeleton height={350} />
        ) : (
          <p>
            Top holder data is still loading or unavailable. Please check back
            soon.
          </p>
        )}
      </div>
      <h2>
        <span className="icon_box">
          <Icon name="move" />
        </span>
        Top {topHolders ? topHolders.length : null}{" "}
        {token ? token.symbol : null} Holders
      </h2>
      <div className="table_row">
        <div className="table_row_inner">
          <table>
            <tbody>
              <tr>
                <th>Rank</th>
                <th>Account Name</th>
                <th>{token ? token.symbol : null} Owned</th>
                <th>Value</th>
                <th>% of issued supply</th>
              </tr>
              {!topHolders ? (
                <>
                  <tr>
                    <td>
                      <Skeleton />
                    </td>
                    <td>
                      <Skeleton />
                    </td>
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
                </>
              ) : null}

              {topHolders &&
                topHolders?.map((holder, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <Link to={`/account/${holder[0]}`}>{holder[0]}</Link>
                    </td>
                    <td>
                      {parseFloat(holder[1]).toLocaleString(undefined, {
                        minimumFractionDigits: 4,
                      })}
                    </td>
                    <td>
                      $
                      {(
                        parseFloat(holder[1]) *
                        (token?.marketdata?.price_usd || 0)
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td>
                      {token?.supply?.circulating || parseFloat(supply?.supply)
                        ? (
                            (holder[1] /
                              (token?.supply?.circulating ||
                                parseFloat(supply?.supply))) *
                            100
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })
                        : 0}
                      %
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

export default TopHolders;
