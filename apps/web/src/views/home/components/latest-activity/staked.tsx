const Staked = () => {
  return (
    <>
      <div className="chart_box big">
        <div className="details">
          <span className="type">STAKED WAX</span>
          {/* <span className="value">+6,845</span> */}
          <span className="val_change">
            <img src="common/images/right_arr.png" alt="right_arr" />
            +0.07%
          </span>
        </div>
        <div className="css_spinner">
          <div className="half left">
            <div className="band" />
          </div>
          <div className="half right">
            <div className="band" />
          </div>
          <span className="value">+6,845</span>
        </div>
        <ul className="data">
          <li>
            <span className="time">12:01</span>
            <span className="val_change">+245</span>
          </li>
          <li>
            <span className="time">12:02</span>
            <span className="val_change">+179</span>
          </li>
          <li>
            <span className="time">12:03</span>
            <span className="val_change">+52</span>
          </li>
          <li>
            <span className="time">12:04</span>
            <span className="val_change">+125</span>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Staked;
