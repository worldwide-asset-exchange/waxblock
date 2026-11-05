const DisplayActionAccountName = ({ action }) => {
  const title = `${action.account} - ${action.name}`;
  let text = `${action.account} - ${action.name}`;
  let borderColor = `rgb(34 36 38 / 15%)`;
  let color = `rgba(0,0,0,.87)`;
  if (action.account === "eosio" && action.name === "undelegatebw") {
    text = "Unstake CPU /NET";
    color = borderColor = "#1664c0";
  }

  return (
    <>
      <span
        className=""
        style={{
          padding: "5px",
          border: `1px solid ${borderColor}`,
          color: `${color}`,
        }}
        title={title}
      >
        {text}
      </span>
    </>
  );
};

export default DisplayActionAccountName;
