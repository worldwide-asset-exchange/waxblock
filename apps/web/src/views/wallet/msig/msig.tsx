import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import BlockchainApiManager from "../../../app/services/blockchainApiManager";
import RequestedApprovals from "./components/requested-approvals";
import Actions from "./components/actions";
import { WalletContext } from "../../../app/contexts/wallet-context";
import { Api, JsonRpc } from "eosjs";
import { JsSignatureProvider } from "eosjs/dist/eosjs-jssig";
import config from "../../../app/config";
import { Helmet } from "react-helmet-async";
import { convertToBoolean } from "../../../app/utilities/utility";

const parseRefBlock = (block_id) => {
  const block_num = block_id.substring(0, 8);
  const block_prefix = block_id.substring(16, 16 + 8);

  const ref_block_num = parseInt(block_num, 16);
  let str = "";
  for (let i = 0; i < block_prefix.length; i = i + 2) {
    const mid = block_prefix
      .substring(i, i + 2)
      .split("")
      .reverse()
      .join("");
    str += mid;
  }
  str = str.split("").reverse().join("");
  const ref_block_prefix = parseInt(str, 16);
  return {
    ref_block_prefix: ref_block_prefix,
    ref_block_num: ref_block_num & 0xffff,
  };
};

const Msig = () => {
  const wallet = useContext(WalletContext);
  const { transactionAlert, setTransactionAlert } = wallet;
  const requestedApprovalsDialogRef = useRef<HTMLDialogElement>(null);
  const [requestedApprovalsError, setRequestedApprovalsError] = useState("");
  const [formData, setFormData] = useState({
    proposer: "",
    proposal_name: generateProposalName(6),
    requested: [{ actor: "", permission: "" }],
    actions: [
      // {
      //   account: "",
      //   name: "",
      //   authorization: [{ actor: "", permission: "" }],
      //   data: {},
      // },
    ],
    settings: {
      enabled: false, //Toggle show hide
      delay_sec: 0,
      expiration: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss"),
      max_cpu_usage_ms: 0,
      max_net_usage_words: 0,
      ref_block_num: "",
      ref_block_prefix: "",
    },
  });
  const { session, multisig } = wallet;
  const sessionActor = session?.actor?.toString() ?? "";

  function generateProposalName(length) {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    let result = "";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }

  const populatedFromMultisigRef = useRef(false);

  useEffect(() => {
    if (
      !multisig.mode ||
      !multisig.walletTransaction ||
      populatedFromMultisigRef.current
    ) {
      return;
    }

    const timeoutTimer = setTimeout(() => {
      populatedFromMultisigRef.current = true;
      const walletTransaction = multisig.walletTransaction;

      setFormData((formData) => {
        const requested = formData.requested.map((entry) => ({ ...entry }));

        walletTransaction.requested_approvals?.forEach(
          (requested_approval, index) => {
            const entry = {
              actor: requested_approval.level.actor,
              permission: requested_approval.level.permission,
            };

            if (requested[index]) {
              requested[index] = entry;
            } else {
              requested.push(entry);
            }
          },
        );

        return {
          ...formData,
          requested,
          actions: [
            ...formData.actions,
            ...walletTransaction.actions.map((action) => ({ ...action })),
          ],
        };
      });
    }, 500);

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [multisig.mode, multisig.walletTransaction]);

  const { data: chaininfo } = useQuery({
    queryKey: [`chaininfo`, formData.settings.expiration],
    queryFn: () => BlockchainApiManager.getInfo(),
  });

  const chainRefBlock = useMemo(() => {
    if (!chaininfo?.last_irreversible_block_id) return null;
    return parseRefBlock(chaininfo.last_irreversible_block_id);
  }, [chaininfo]);

  const proposeMsig = async () => {
    if (
      formData.requested.length === 0 ||
      formData.requested.some(
        ({ actor, permission }) => !actor.trim() || !permission.trim(),
      )
    ) {
      setRequestedApprovalsError(
        "Actor and permission are required for every requested approval.",
      );
      if (!requestedApprovalsDialogRef.current?.open) {
        requestedApprovalsDialogRef.current?.showModal();
      }
      return;
    }

    setRequestedApprovalsError("");

    try {
      const signatureProvider = new JsSignatureProvider([]);
      const rpc = new JsonRpc(config.endpoints.default); //required to read blockchain state
      const api = new Api({ rpc, signatureProvider }); //required to submit transactions

      //Latest addition to handle boolean issue start
      formData.actions.forEach((action) => {
        if (action.actionStruct) {
          action.actionStruct.fields.forEach((field) => {
            let value;
            try {
              value = JSON.parse(action.data[field.name]);
            } catch {
              value = action.data[field.name];
            }

            if (field.type === "bool") {
              value = convertToBoolean(action.data[field.name]);
            }

            action.data[field.name] = typeof value !== "undefined" ? value : "";
          });
        }
      });
      //Latest addition to handle boolean issue end

      const serialized_actions = await api.serializeActions(formData.actions);

      const msigTransaction = {};
      msigTransaction.delay_sec = formData.settings.delay_sec;
      msigTransaction.actions = [];

      msigTransaction.actions.push({
        account: "eosio.msig",
        name: "propose",
        data: {
          proposer: formData.proposer || sessionActor,
          proposal_name: formData.proposal_name,
          requested: formData.requested,
          trx: {
            actions: serialized_actions,
            delay_sec: formData.settings.delay_sec,
            expiration: formData.settings.expiration,
            max_cpu_usage_ms: formData.settings.max_cpu_usage_ms,
            max_net_usage_words: formData.settings.max_net_usage_words,
            ref_block_num:
              formData.settings.ref_block_num ||
              chainRefBlock?.ref_block_num ||
              "",
            ref_block_prefix:
              formData.settings.ref_block_prefix ||
              chainRefBlock?.ref_block_prefix ||
              "",
            context_free_actions: [],
            transaction_extensions: [],
          },
        },
      });

      wallet.submitTransaction(msigTransaction);
    } catch (err) {
      setTransactionAlert({
        type: "error",
        message: err.message,
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>MSIG | Wallet - WAX Explorer</title>
      </Helmet>

      <div className="form_box msig_form active">
        <h2>MSIG Propose</h2>
        <form>
          <Actions formData={formData} setFormData={setFormData} />

          <h2>Proposal Info</h2>
          <div className="field_row1">
            <label>Proposer</label>
            <input
              type="text"
              value={formData.proposer || sessionActor}
              onChange={(event) =>
                setFormData((formData) => ({
                  ...formData,
                  proposer: event.target.value,
                }))
              }
            />
          </div>
          <div className="field_row1">
            <label>Proposal Name</label>
            <input
              type="text"
              value={formData.proposal_name}
              onChange={(event) =>
                setFormData((formData) => ({
                  ...formData,
                  proposal_name: event.target.value,
                }))
              }
            />
          </div>
          <RequestedApprovals formData={formData} setFormData={setFormData} />
          {requestedApprovalsError ? (
            <p id="requested-approvals-error" className="alert" role="alert">
              {requestedApprovalsError}
            </p>
          ) : null}
          <dialog
            ref={requestedApprovalsDialogRef}
            className="msig_validation_dialog"
            aria-labelledby="msig-validation-title"
            aria-describedby="msig-validation-message"
          >
            <h2 id="msig-validation-title">Missing approval details</h2>
            <p id="msig-validation-message">
              Actor and permission are required for every requested approval.
            </p>
            <input
              type="button"
              value="Review fields"
              onClick={() => {
                requestedApprovalsDialogRef.current?.close();
                Array.from(
                  document.querySelectorAll<HTMLInputElement>(
                    ".req_appr input[name='actor'], .req_appr input[name='permission']",
                  ),
                )
                  .find((input) => !input.value.trim())
                  ?.focus();
              }}
            />
          </dialog>

          <div className="field_row1 short_space">
            <label>
              Transaction Settings
              <input
                type="button"
                className="side_btn toggle_settings"
                value={`${formData.settings.enabled ? "Hide" : "Show"}`}
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      enabled: !prev.settings.enabled,
                    },
                  }));
                }}
              />
            </label>
          </div>
          {formData.settings.enabled ? (
            <div
              className="trans_set"
              id="trans_set"
              style={{ display: "block" }}
            >
              <div className="field_row1">
                <label>max_net_usage_words</label>
                <input
                  type="text"
                  value={formData.settings.max_net_usage_words}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        max_net_usage_words: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>max_cpu_usage_ms</label>
                <input
                  type="text"
                  value={formData.settings.max_cpu_usage_ms}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        max_cpu_usage_ms: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>delay_sec</label>
                <input
                  type="text"
                  value={formData.settings.delay_sec}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        delay_sec: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>expiration</label>
                <input
                  type="text"
                  value={formData.settings.expiration}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        expiration: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>ref_block_num</label>
                <input
                  type="text"
                  value={
                    formData.settings.ref_block_num ||
                    chainRefBlock?.ref_block_num ||
                    ""
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        ref_block_num: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>ref_block_prefix</label>
                <input
                  type="text"
                  value={
                    formData.settings.ref_block_prefix ||
                    chainRefBlock?.ref_block_prefix ||
                    ""
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        ref_block_prefix: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>context_free_actions</label>
                <input
                  type="text"
                  value={formData.settings.context_free_actions}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        context_free_actions: event.target.value,
                      },
                    })
                  }
                />
              </div>
              <div className="field_row1">
                <label>transaction_extensions</label>
                <input
                  type="text"
                  value={formData.settings.transaction_extensions}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        transaction_extensions: event.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="field_row1">
            <input type="button" value="PROPOSE" onClick={proposeMsig} />
          </div>
        </form>

        {transactionAlert &&
        transactionAlert.type === "success" &&
        transactionAlert.walletTransaction.actions &&
        transactionAlert.walletTransaction.actions[0].account ===
          "eosio.msig" &&
        transactionAlert.walletTransaction.actions[0].name === "propose" ? (
          <>
            <div className="alert alert-success active">
              <p>
                Your new MSIG is successfully created, open{" "}
                <a
                  href={`/msig/${transactionAlert.walletTransaction.actions[0].data.proposer}/${transactionAlert.walletTransaction.actions[0].data.proposal_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline" }}
                >
                  {
                    transactionAlert.walletTransaction.actions[0].data
                      .proposal_name
                  }
                </a>
              </p>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

export default Msig;
