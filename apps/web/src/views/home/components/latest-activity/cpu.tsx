const Cpu = () => {
  return (
    <>
      <div className="chart_box">
        <div className="details">
          <span className="type">CPU</span>
          <span className="value">5,566,785</span>
          <span className="val_change">
            <img src="common/images/right_arr.png" alt="up_arr" />
            +12.75%
          </span>
        </div>
        <div className="gauge red">
          <div className="percentage" />
          <div className="mask" />
        </div>
      </div>
    </>
  );
};

export default Cpu;
