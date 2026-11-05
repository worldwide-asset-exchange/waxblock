import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Icon from "../../../../app/components/ui/Icon";
import { Numeric } from "eosjs";
import { generateKeyPair } from "eosjs/dist/eosjs-key-conversions";
import copy from "copy-to-clipboard";

const createKeyPair = () => {
  const keyPair = generateKeyPair(Numeric.KeyType.k1, {
    secureEnv: true,
  });

  return {
    public_key: keyPair.publicKey.toString(),
    private_key: keyPair.privateKey.toString(),
  };
};

const Keys = () => {
  const [formData, setFormData] = useState(createKeyPair);

  const generateNewKeys = () => {
    setFormData(createKeyPair());
  };

  const copyToClipboard = async (type) => {
    switch (type) {
      case "public":
        await copy(formData.public_key);
        break;
      case "private":
        await copy(formData.private_key);
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Helmet>
        <title>Key Generator | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="info-box">
        <Icon name="info" />
        This tool generates a new pair of public and private keys. These keys
        are generated locally in your browser and are <strong>not</strong>{" "}
        automatically linked to any account. To use them, you must manually
        assign them to an account.
      </div>

      <form id="keys" className="forms_type active">
        <div className="field_row1">
          <label>Public Key:</label>
          <div className="clipboard">
            <input type="text" value={formData.public_key} readOnly />
            <button
              className="copy_btn"
              type="button"
              onClick={() => copyToClipboard("public")}
            >
              <Icon name="clipboard" />
            </button>
          </div>
        </div>
        <div className="field_row1">
          <label>Private Key:</label>
          <div className="clipboard">
            <input type="text" value={formData.private_key} readOnly />
            <button
              className="copy_btn"
              type="button"
              onClick={() => copyToClipboard("private")}
            >
              <Icon name="clipboard" />
            </button>
          </div>
        </div>
        <div className="field_row1">
          <span className="alert">
            <Icon name="alert" />
            Please save and safely store your private keys.
          </span>
        </div>
        <div className="field_row1">
          <input
            type="button"
            defaultValue="Generate New Keys"
            onClick={() => generateNewKeys()}
          />
        </div>
      </form>
    </>
  );
};

export default Keys;
