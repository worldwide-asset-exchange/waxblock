const Wallets = () => {
  return (
    <>
      <div className="chart_box big">
        <div className="details">
          <span className="type">NEW WALLETS</span>
          <span className="value">+2,566</span>
          <span className="val_change">
            <img src="common/images/up_arr.svg" alt="right_arr" />
            +12.75%
          </span>
        </div>
        <div className="bar_box">
          <ul className="y_bar">
            <li>
              12:04
              <span />
            </li>
            <li>
              12:03
              <span />
            </li>
            <li>
              12:02
              <span />
            </li>
            <li>
              12:01
              <span />
            </li>
          </ul>
          <ul className="x_bar">
            <li>100</li>
            <li>200</li>
            <li>300</li>
            <li>400</li>
            <li>500</li>
            <li>600</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default Wallets;
