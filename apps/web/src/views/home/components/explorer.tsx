import Highcharts from "../../../app/utilities/highcharts";
import { HighchartsReact } from "highcharts-react-official";
import { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "../../../app/contexts/socket-context";
import { numberFormat } from "../../../app/utilities/format";

const generateData = () => {
  // generate an array of random data
  const data = [];
  const timestamp = Math.floor((Date.now() - 12 * 1000) / 1000) * 1000;
  for (let i = -10; i < 0; i += 1) {
    data.push({
      x: timestamp + i * 1000,
      y: 0,
    });
  }

  return data;
};

const Explorer = () => {
  const socket = useContext(SocketContext);
  const chartRef = useRef(null);
  const [seriesFilters, setSeriesFilters] = useState<
    { name: string; color: string; visible: boolean }[]
  >([]);

  const syncSeriesFilters = (chart) => {
    setSeriesFilters(
      chart.series.map((series) => ({
        name: series.name,
        color: series.color,
        visible: series.visible,
      })),
    );
  };

  const data = generateData();

  const [options] = useState({
    chart: {
      type: "areaspline",
      backgroundColor: "#1B1B41",
    },
    title: {
      text: "",
    },
    accessibility: {
      description:
        "Live area spline chart showing recent transactions per dapp on the WAX network.",
    },
    legend: {
      layout: "vertical",
      align: "left",
      verticalAlign: "top",
      enabled: window.innerWidth < 768 ? false : true,
      x: 300,
      y: 0,
      floating: true,
      shadow: true,
      borderWidth: 0,
      borderRadius: "3px",
      backgroundColor: "#0A0A27",
      //labelFormat: "{name}&nbsp;&nbsp;180,034",
      title: {
        text: "LATEST TXNS PER DAPP",
        style: {
          color: "#ffffff",
        },
      },
      labelFormatter: function () {
        const record = this.data[this.data.length - 1];
        return this.name + " " + numberFormat(record ? record.y : 0) + " TXNS";
      },
      padding: 12,
      itemMarginBottom: 3,
      itemMarginTop: 3,
      itemStyle: {
        color: "#ffffff",
        fontWeight: "normal",
        fontSize: "14px",
      },
      itemHoverStyle: {
        color: "#878787",
      },
    },
    xAxis: {
      // categories: [
      //   "12:01",
      //   "12:02",
      //   "12:03",
      //   "12:04",
      //   "12:05",
      //   "12:06",
      //   "12:07",
      //   "12:08",
      //   "12:09",
      //   "12:10",
      //   "12:11",
      // ],
      gridLineWidth: 1,
      minorGridLineWidth: 0,
      gridLineDashStyle: "longdash",
      gridLineColor: "#37376C",
      lineColor: "transparent",
      type: "datetime",
      labels: {
        overflow: "justify",
        style: { color: "#ffffff", fontSize: "8px" },
      },
    },
    yAxis: {
      title: {
        text: "Transactions",
      },
      gridLineWidth: 0,
      minorGridLineWidth: 0,
      labels: {
        style: { color: "#ffffff", fontSize: "8px" },
      },
    },
    tooltip: {
      shared: true,
      valueSuffix: " transactions",
    },
    credits: {
      enabled: false,
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.5,
      },
    },
    series: [
      { name: "Top 1", color: "#FF2CC4", lineWidth: 3, data: [...data] },
      { name: "Top 2", color: "#7C00A8", lineWidth: 3, data: [...data] },
      { name: "Top 3", color: "#0075FF", lineWidth: 3, data: [...data] },
      { name: "Top 4", color: "#0BBD7D", lineWidth: 3, data: [...data] },
      { name: "Top 5", color: "#7798BF", lineWidth: 3, data: [...data] },
    ],
  });

  useEffect(() => {
    if (!socket?.connected) return;

    socket
      .off("topPerSecondDapps")
      .on("topPerSecondDapps", (topPerSecondDapps) => {
        const timestamp = new Date(`${topPerSecondDapps.timestamp}Z`).getTime();

        const topPerSecondDappsSorted = topPerSecondDapps.data.sort(
          function (a, b) {
            return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
          },
        );

        chartRef.current.chart.series.forEach(function (series, index) {
          const topPerSecondDapp = topPerSecondDappsSorted[index] || null;

          series.update(
            { name: topPerSecondDapp ? topPerSecondDapp.name : series.name },
            false,
          );
          series.addPoint(
            {
              x: timestamp,
              y: topPerSecondDapp ? topPerSecondDapp.count : 0,
            },
            false,
            true,
          );

          // series.update(
          //   {
          //     name: topPerSecondDapp ? topPerSecondDapp.name : series.name,
          //     data: [
          //       ...series.data,
          //       {
          //         x: timestamp,
          //         y: topPerSecondDapp ? topPerSecondDapp.count : 0,
          //       },
          //     ].slice(-10),
          //   },
          //   false
          // );
        });

        // Sort only legend items by transaction count
        const legendItems = chartRef.current.chart.series.map((series) => {
          const record = series.data[series.data.length - 1];
          return {
            series: series,
            name: series.name,
            y: record ? record.y : 0,
          };
        });

        // Sort by transaction count in descending order
        const sortedLegendItems = [...legendItems].sort((a, b) => b.y - a.y);

        // Update only legendIndex to control legend order without affecting chart
        sortedLegendItems.forEach((item, index) => {
          item.series.update(
            {
              legendIndex: index,
            },
            false,
          );
        });

        chartRef.current.chart.redraw();
        syncSeriesFilters(chartRef.current.chart);

        // topPerSecondDappsSorted.forEach(function (topPerSecondDapp, index) {
        //   //if (chartRef.current.chart.series[index].data.length >= 10) {
        //   //chartRef.current.chart.series[index].data[0].remove();
        //   //}

        //   chartRef.current.chart.series[index].update(
        //     {
        //       name: topPerSecondDapp.name,
        //       data: [
        //         ...chartRef.current.chart.series[index].data,
        //         {
        //           x: timestamp,
        //           y: topPerSecondDapp.count,
        //         },
        //       ].slice(-10),
        //     },
        //     false
        //   );
        //   // chartRef.current.chart.series[index].addPoint({
        //   //   x: timestamp,
        //   //   y: topDapp.count,
        //   // });
        // });
        // chartRef.current.chart.redraw();
      });
  }, [socket, socket?.connected]);

  return (
    <>
      <div className="cont_sec exp_sec">
        <h2>WAX Explorer</h2>
        <p>Transactions on WAX</p>
        {/* <div className="chart_tabbing">
          <a href="#" className="toggle_tabs">
            Transactions
          </a>
          <ul className="chart_tabs">
            <li className="faded">
              <a className="filtered active" href="#" data-title="transactions">
                Transactions
              </a>
            </li>
            <li>
              <a className="filtered" href="#" data-title="cpu-usage">
                CPU Usage
              </a>
            </li>
          </ul>
        </div>
        <div className="time_list">
          <ul>
            <li className="active">
              <a href="#">1H</a>
            </li>
            <li>
              <a href="#">1D</a>
            </li>
            <li>
              <a href="#">1W</a>
            </li>
            <li>
              <a href="#">1M</a>
            </li>
            <li>
              <a href="#">1Y</a>
            </li>
          </ul>
        </div> */}
        <div className="chart_block transactions" id="transactions">
          <div className="box_inner">
            <HighchartsReact
              highcharts={Highcharts}
              options={options}
              ref={chartRef}
              callback={(chart) => syncSeriesFilters(chart)}
            />
          </div>
          <div className="filters" style={{ justifyContent: "center" }}>
            {seriesFilters.map((series, index) => (
              <a
                href="#"
                className="filter"
                key={index}
                style={{
                  borderColor: series.visible ? series.color : "#26264E",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  const chart = chartRef.current?.chart;
                  if (!chart) return;
                  const chartSeries = chart.series[index];
                  chartSeries.setVisible(!chartSeries.visible);
                  syncSeriesFilters(chart);
                }}
              >
                {/* <span
                    style={{
                      background:
                        "url(/common/images/icon.png) no-repeat center center",
                    }}
                  /> */}
                &nbsp;&nbsp;&nbsp;{series.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Explorer;
