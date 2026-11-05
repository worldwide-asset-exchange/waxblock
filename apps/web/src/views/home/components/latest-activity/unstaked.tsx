const Unstaked = () => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">UNSTAKED WAX</span>
          <span className="value">5,566,785</span>
          <span className="val_change">
            <img src="common/images/down_arr.svg" alt="up_arr" />
            +12.75%
          </span>
        </div>
        <div className="css_spinner small">
          <div className="half left">
            <div className="band" />
          </div>
          <div className="half right">
            <div className="band" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Unstaked;
