import { useRef } from "react";
import { Helmet } from "react-helmet-async";

import { Api, JsonRpc, Serialize } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";
import config from "../../../../app/config";
import { bufferToHex } from "../../../../app/utilities/utility";
import { useContext } from "react";
import { WalletContext } from "../../../../app/contexts/wallet-context";

const UploadContract = () => {
  const wallet = useContext(WalletContext);
  const { session } = wallet;

  const wasmFileRef = useRef(null);
  const abiFileRef = useRef(null);

  const signatureProvider = new JsSignatureProvider([]);
  const rpc = new JsonRpc(config.endpoints.default); //required to read blockchain state
  const api = new Api({ rpc, signatureProvider }); //required to submit transactions

  const uploadContract = async () => {
    const walletTransaction = {};
    walletTransaction.type = "uploadContract";
    walletTransaction.actions = [];

    const wasm_file = wasmFileRef.current;
    if (wasm_file.files[0]) {
      const wasm_reader = new FileReader();
      await new Promise((resolve) => {
        wasm_reader.onload = () => {
          resolve();
        };
        wasm_reader.readAsArrayBuffer(wasm_file.files[0]);
      });

      const wasm_code = bufferToHex(wasm_reader.result);
      //const wasm_code = convertToHex(new Uint8Array(wasm_reader.result));

      walletTransaction.actions.push({
        account: "eosio",
        name: "setcode",
        data: {
          account: session ? session.actor.toString() : "",
          code: wasm_code,
          vmtype: 0,
          vmversion: 0,
        },
      });
    }

    const abi_file = abiFileRef.current;
    if (abi_file.files[0]) {
      const abi_reader = new FileReader();
      await new Promise((resolve) => {
        abi_reader.onload = () => {
          resolve();
        };
        abi_reader.readAsText(abi_file.files[0]);
      });

      const buffer = new Serialize.SerialBuffer({
        textEncoder: api.textEncoder,
        textDecoder: api.textDecoder,
      });

      let abi_code;
      try {
        abi_code = JSON.parse(abi_reader.result);

        const abiDefinition = api.abiTypes.get(`abi_def`);

        abi_code = abiDefinition.fields.reduce(
          (acc, { name: fieldName }) =>
            Object.assign(acc, { [fieldName]: acc[fieldName] || [] }),
          abi_code,
        );
        abiDefinition.serialize(buffer, abi_code);
        abi_code = bufferToHex(buffer.asUint8Array());
      } catch {
        abi_code = abi_reader.result;
      }

      walletTransaction.actions.push({
        account: "eosio",
        name: "setabi",
        data: {
          account: session ? session.actor.toString() : "",
          abi: abi_code,
        },
      });
    }

    wallet.submitTransaction(walletTransaction);
  };

  return (
    <>
      <Helmet>
        <title>Upload Contract | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="upload-contract" className="forms_type active">
        <div className="field_row1">
          <label>WASM</label>
          <input
            type="file"
            id="wasm_file"
            name="wasm_file"
            ref={wasmFileRef}
          />
        </div>
        <div className="field_row1">
          <label>ABI</label>
          <input type="file" id="abi_file" name="abi_file" ref={abiFileRef} />
        </div>
        <div className="field_row1">
          <input type="button" defaultValue="Upload" onClick={uploadContract} />
        </div>
      </form>
    </>
  );
};

export default UploadContract;
