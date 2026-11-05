import Highcharts from "../../../../app/utilities/highcharts";
import { HighchartsReact } from "highcharts-react-official";

import { useState } from "react";

import data from "../../../../dummy-data/usdeur.json";

const Accounts = () => {
  const [options] = useState({
    chart: {
      backgroundColor: null,
      margin: 0,
      height: "80px",
    },
    title: { text: "" },
    accessibility: {
      description: "Area chart showing recent account activity.",
    },
    xAxis: {
      gridLineWidth: 0,
      minorGridLineWidth: 0,
      type: "",
      labels: { enabled: false },
    },
    yAxis: {
      title: { text: "" },
      gridLineWidth: 0,
      minorGridLineWidth: 0,
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
      <div className="chart_box">
        <div className="details">
          <span className="type">ACCOUNTS</span>
          <span className="value">5,566,785</span>
          <span className="val_change">
            <img src="/common/images/up_arr.svg" alt="up_arr" />
            +12.75%
          </span>
        </div>
        <div id="transact_container2">
          <HighchartsReact highcharts={Highcharts} options={options} />
        </div>
      </div>
    </>
  );
};

export default Accounts;
