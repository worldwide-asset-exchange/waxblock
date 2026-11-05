import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Numeric } from "eosjs";

const FormatKeys = () => {
  const [formData, setFormData] = useState({
    public_key: "",
    private_key: "",
  });

  const formatkeys = async (type) => {
    switch (type) {
      case "public": {
        const public_key = formData.public_key;
        const key = Numeric.stringToPublicKey(public_key);
        let format_key;
        if (public_key.startsWith("PUB_K1")) {
          format_key = Numeric.publicKeyToLegacyString(key);
        } else if (public_key.startsWith("EOS")) {
          format_key = Numeric.publicKeyToString(key);
        }

        if (format_key)
          setFormData((formData) => ({
            ...formData,
            public_key: format_key,
          }));
        break;
      }
      case "private": {
        const private_key = formData.private_key;
        const privateKey = Numeric.stringToPrivateKey(private_key);
        let privateFormatKey;
        if (private_key.startsWith("PVT_K1")) {
          privateFormatKey = Numeric.privateKeyToLegacyString(privateKey);
        } else {
          privateFormatKey = Numeric.privateKeyToString(privateKey);
        }

        if (privateFormatKey)
          setFormData((formData) => ({
            ...formData,
            private_key: privateFormatKey,
          }));
        break;
      }
      default:
        break;
    }
  };

  return (
    <>
      <Helmet>
        <title>Format Keys | Wallet - WAX Explorer</title>
      </Helmet>

      <form id="format-keys" className="forms_type active">
        <div className="field_row1">
          <label>Public Key (PUB_K1) to Old Format:</label>
          <input
            type="text"
            placeholder="New Public Key (PUB_K1)"
            value={formData.public_key}
            onChange={(event) =>
              setFormData({ ...formData, public_key: event.target.value })
            }
          />
        </div>
        <div className="field_row1">
          <input
            type="button"
            defaultValue="Format"
            onClick={() => formatkeys("public")}
          />
        </div>
        <div className="field_row1">
          <label>Private Key (PVT_K1) to Old Format:</label>
          <input
            type="text"
            placeholder="New Private Key (PVT_K1)"
            value={formData.private_key}
            onChange={(event) =>
              setFormData({ ...formData, private_key: event.target.value })
            }
          />
        </div>
        <div className="field_row1">
          <input
            type="button"
            defaultValue="Format"
            onClick={() => formatkeys("private")}
          />
        </div>
        {/* <div className="field_row1">
            <label>Mnemonic to Private Key:</label>
            <input type="text" placeholder="New Private Key (PVT_K1)" />
          </div>
          <div className="field_row1">
            <input
              type="button"
              defaultValue="Format"
              onClick={() => formatkeys()}
            />
          </div> */}
      </form>
    </>
  );
};

export default FormatKeys;
