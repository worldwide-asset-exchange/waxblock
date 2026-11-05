import Highcharts from "../../../app/utilities/highcharts";
import { HighchartsReact } from "highcharts-react-official";
import "highcharts/highcharts-more";
import "highcharts/modules/solid-gauge";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { bytesFormat, microsecondsFormat } from "../../../app/utilities/format";
import { Link } from "react-router";

const ResourceUtilization = ({ account }) => {
  let net_percentage = parseFloat(
    (
      ((account.net_limit.current_used || account.net_limit.used) /
        account.net_limit.max) *
      100
    ).toFixed(0),
  );
  net_percentage =
    isNaN(net_percentage) || net_percentage < 0 || net_percentage > 100
      ? 100
      : net_percentage;

  let cpu_percentage = parseFloat(
    (
      ((account.cpu_limit.current_used || account.cpu_limit.used) /
        account.cpu_limit.max) *
      100
    ).toFixed(0),
  );
  cpu_percentage =
    isNaN(cpu_percentage) || cpu_percentage < 0 || cpu_percentage > 100
      ? 100
      : cpu_percentage;

  let ram_percentage = parseFloat(
    ((account.ram_usage / account.ram_quota) * 100).toFixed(0),
  );
  ram_percentage =
    isNaN(ram_percentage) || ram_percentage < 0 || ram_percentage > 100
      ? 100
      : ram_percentage;

  let total_percentage = (
    (ram_percentage + cpu_percentage + net_percentage) /
    3
  ).toFixed(0);
  total_percentage = total_percentage > 100 ? 100 : total_percentage;

  const [options] = useState({
    chart: {
      type: "solidgauge",
      height: "100%",
      margin: [0, 0, 0, 0],
      spacing: [0, 0, 0, 0],
      backgroundColor: null,
      // events: {
      //     render: renderIcons
      // }
    },

    title: {
      text: "",
      style: {
        fontSize: "24px",
      },
    },

    accessibility: {
      description:
        "Resource utilization chart showing RAM, CPU, and NET usage percentages for the current account.",
    },

    tooltip: {
      borderWidth: 0,
      backgroundColor: "none",
      shadow: false,
      useHTML: true,
      style: {
        fontSize: "12px",
      },
      valueSuffix: "%",
      pointFormat:
        '<span style="font-size:24px; color:#ffffff; font-family: Open Sans, sans-serif; font-weight: 600; text-align: center;">{point.y}</span><br><span style="font-size:12px; color:#ffffff; font-family: Open Sans, sans-serif; font-weight: 400; text-align: center;">{series.name}</span>',
      positioner: function (labelWidth, labelHeight) {
        return {
          x: (this.chart.chartWidth - labelWidth) / 2,
          y: (this.chart.chartHeight - labelHeight) / 2,
        };
      },
    },
    credits: {
      enabled: false,
    },

    pane: {
      startAngle: 0,
      endAngle: 360,
      background: [
        {
          // Track for Move
          outerRadius: "100%",
          innerRadius: "86%",
          backgroundColor: Highcharts.color("#0C0C2D").setOpacity(1).get(),
          borderWidth: 0,
        },
        {
          // Track for Exercise
          outerRadius: "81%",
          innerRadius: "67%",
          backgroundColor: Highcharts.color("#0C0C2D").setOpacity(1).get(),
          borderWidth: 0,
        },
        {
          // Track for Stand
          outerRadius: "62%",
          innerRadius: "48%",
          backgroundColor: Highcharts.color("#0C0C2D").setOpacity(1).get(),
          borderWidth: 0,
        },
      ],
    },

    yAxis: {
      min: 0,
      max: 100,
      lineWidth: 0,
      tickPositions: [],
    },

    plotOptions: {
      solidgauge: {
        dataLabels: {
          enabled: false,
        },
        linecap: "round",
        stickyTracking: false,
        rounded: true,
      },
    },

    series: [
      {
        name: "RAM",
        data: [
          {
            color: "#005C40", //#00E392
            radius: "100%",
            innerRadius: "86%",
            y: ram_percentage,
          },
        ],
      },
      {
        name: "CPU",
        data: [
          {
            color: "#D46E1E", //#FFA724
            radius: "81%",
            innerRadius: "67%",
            y: cpu_percentage,
          },
        ],
      },
      {
        name: "NET",
        data: [
          {
            color: "#625B9E", //#A798FF
            radius: "62%",
            innerRadius: "48%",
            y: net_percentage,
          },
        ],
      },
    ],
  });

  return (
    <>
      <div className="util_chart">
        <div className="util_chart_box">
          <div className="util_container">
            <HighchartsReact highcharts={Highcharts} options={options} />
            <h4>
              {total_percentage}%<span>utilization</span>
            </h4>
          </div>
        </div>
        <div className="util_legends">
          <ul>
            <li>
              <span className="dot green" />
              RAM{" "}
              <span className="data">
                {account ? (
                  <>
                    ({bytesFormat(account.ram_usage, 2)} /
                    {bytesFormat(account.ram_quota, 2)})
                  </>
                ) : (
                  <Skeleton />
                )}
              </span>
            </li>
            <li>
              <span className="dot orange" />
              CPU{" "}
              <span className="data">
                {account ? (
                  <>
                    (
                    {microsecondsFormat(
                      account.cpu_limit.current_used || account.cpu_limit.used,
                      2,
                    )}{" "}
                    / {microsecondsFormat(account.cpu_limit.max, 2)})
                  </>
                ) : (
                  <Skeleton />
                )}
              </span>
            </li>
            <li>
              <span className="dot purple" />
              NET{" "}
              <span className="data">
                {account ? (
                  <>
                    (
                    {bytesFormat(
                      account.net_limit.current_used || account.net_limit.used,
                      2,
                    )}{" "}
                    / {bytesFormat(account.net_limit.max, 2)})
                  </>
                ) : (
                  <Skeleton />
                )}
              </span>
            </li>
          </ul>

          <Link className="btn" to={`/wallet/resources`}>
            STAKE RESOURCES
          </Link>
        </div>
      </div>
    </>
  );
};

export default ResourceUtilization;
