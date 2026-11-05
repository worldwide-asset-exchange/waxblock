const getShortTrxId = (trx_id) => {
  return trx_id.substring(0, 8);
};

export { getShortTrxId };
