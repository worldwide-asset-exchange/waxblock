const Ram = () => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">RAM</span>
          <span className="value">5,566,785</span>
          <span className="val_change">
            <img src="common/images/up_arr.svg" alt="up_arr" />
            +12.75%
          </span>
        </div>
        <div className="gauge green">
          <div className="percentage" />
          <div className="mask" />
        </div>
      </div>
    </>
  );
};

export default Ram;
