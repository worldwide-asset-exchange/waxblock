import Highcharts from "../../../../app/utilities/highcharts";
import { HighchartsReact } from "highcharts-react-official";

import { useState } from "react";

import data from "../../../../dummy-data/usdeur.json";

const Transactions = () => {
  const [options] = useState({
    chart: {
      backgroundColor: null,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 25,
      marginLeft: 0,
      height: "100px",
    },
    title: { text: "" },
    accessibility: {
      description: "Area chart showing recent transaction activity.",
    },
    xAxis: {
      gridLineWidth: 1,
      minorGridLineWidth: 0,
      gridLineDashStyle: "longdash",
      gridLineColor: "#37376C",
      lineColor: "transparent",
      type: "",
      labels: {
        style: {
          color: "#ffffff",
          fontSize: "8px",
        },
      },
    },
    yAxis: {
      title: { text: "" },
      gridLineWidth: 0,
      minorGridLineWidth: 0,
      gridLineColor: "#37376C",
      labels: { enabled: false },
    },
    credits: {
      enabled: false,
    },
    legend: { enabled: false },
    plotOptions: {
      area: {
        fillColor: {
          linearGradient: {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 1,
          },
          stops: [
            [0, Highcharts.getOptions().colors[2]],
            [
              1,
              Highcharts.color(Highcharts.getOptions().colors[2])
                .setOpacity(0)
                .get("rgba"),
            ],
          ],
        },
        threshold: null,
        color: {
          pattern: {
            path: { fill: "#ffffff" },
          },
        },
      },
    },
    series: [
      {
        type: "area",
        name: "Time",
        data: data,
      },
    ],
  });

  return (
    <>
      <div className="chart_box big">
        <div className="details">
          <span className="type">TRANSACTIONS</span>
          <span className="value">5,566,785</span>
          <span className="val_change">
            <img src="common/images/up_arr.svg" alt="right_arr" />
            13.7%
          </span>
        </div>
        <div id="transact_container">
          <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
      </div>
    </>
  );
};

export default Transactions;
