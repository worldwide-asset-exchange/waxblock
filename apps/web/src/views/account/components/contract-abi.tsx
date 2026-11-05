import JsonViewer from "../../../app/components/ui/JsonViewer";

const ContractAbi = ({ accountAbi }) => {
  return (
    <>
      <JsonViewer value={accountAbi} />
    </>
  );
};

export default ContractAbi;
