// Copyright 2022-2024 use-ink/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import React, { useEffect, useState } from "react"
import useBackendAPI from "../api/useBackendAPI"
import {
  Binary,
  createClient,
  Enum,
  HexString,
  PolkadotClient,
  PolkadotSigner,
  UnsafeApi,
  UnsafeTransaction,
} from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
// import { useSelectedAccount } from "@/context"
import { useAccounts } from '@/context/AccountsContext'
import { Button } from "@/components/ui/button.tsx"
import { Modal } from "@/Modal"
import { CodeUploadResult, ContractExecutionResult, DryRun } from "@/DryRun"
import { ChainProperties } from "@/lib/utils.ts"
import { InfoIcon } from "@/DryRun/DryRun.tsx"

export const SigningPortal: React.FC = () => {
  const { fetchPayload, submitData, terminate } = useBackendAPI();

  const [client, setClient] = useState<PolkadotClient | null>(null);
  const [api, setApi] = useState<UnsafeApi<any> | null>(null);
  const [_originalCallData, setOriginalCallData] = useState<Uint8Array | null>(null);
  const [_callData, setCallData] = useState<Binary | null>(null);
  const [tx, setTx] = useState<UnsafeTransaction<any, string, string, any> | null>(null);
  const [rpc, setRpc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContract, setIsContract] = useState<boolean>(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [useGasEstimates, setUseGasEstimates] = useState<boolean>(true);
  const [chainProperties, setChainProperties] = useState<ChainProperties>({ss58Format: 42, tokenDecimals: 12, tokenSymbol: "UNIT"});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signing, setSigning] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    confirmClass?: string;
    cancelText?: string;
    showCancelButton?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    title: "",
    message: "",
  });

  const { selectedAccount } = useAccounts()

  // Fetch the payload on component mount
  useEffect(() => {
    const loadPayload = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPayload();
        setRpc(result.chain_rpc);
        setOriginalCallData(result.call_data);
        let client = createClient(withPolkadotSdkCompat(getWsProvider(result.chain_rpc)));
        setClient(client);
        let api = client.getUnsafeApi();
        setApi(api);

        // binaryFromBytes was not working. Converting to hex and back works.
        let binaryFromBytes = Binary.fromBytes(result.call_data);
        let hex: HexString = binaryFromBytes.asHex();
        let callData = Binary.fromHex(hex);
        setCallData(callData);
        const tx = await api.txFromCallData(callData);
        setTx(tx);
        setIsContract(tx.decodedCall.type === "Contracts");

        // Automatically trigger dry run if it's a contract call
        if (tx.decodedCall.type === "Contracts") {
          dryRun(tx, api);
        }
      } catch (err) {
        console.log(err);
        setError("Failed to connect to server or fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadPayload();
  }, [fetchPayload]);

  useEffect(() => {
    const loadChainProperties = async () => {
      if (client) {
        let chainSpec = await client.getChainSpecData();
        if (chainSpec.properties.ss58Format && chainSpec.properties.tokenDecimals && chainSpec.properties.tokenSymbol) {
          setChainProperties(chainSpec.properties)
        }
      }
    }

    loadChainProperties();
  }, [client]);

  // Re-run dry run if selected account changes
  useEffect(() => {
    if (isContract && tx && api) {
      dryRun(tx, api);
    }
  }, [selectedAccount, isContract, tx, api]);

  const handleTerminate = async () => {
    setLoading(true);
    setError(null);

    setModalConfig({
      title: "Cancel Signing",
      message: "Are you sure you want to cancel the signing? This will close the server and tab.",
      confirmText: "Yes, Cancel",
      cancelText: "Go Back",
      onConfirm: async () => {
        try {
          await terminate();
          window.close();
        } catch (err) {
          console.log(err);
          setError("Failed to terminate the server. Is it already closed?");
        } finally {
          setLoading(false);
        }
        console.log("Server closed.");
        setIsModalOpen(false);
      },
      onCancel: () => setIsModalOpen(false),
    });
    setIsModalOpen(true);
  };

  const dryRun = async (tx: UnsafeTransaction<any, string, string, any>, api: UnsafeApi<any>) => {
    let decodedCall = tx?.decodedCall;
    if (!selectedAccount || decodedCall?.type !== "Contracts") {
      return;
    }

    let args = decodedCall.value.value;
    let code = args.code;
    let data = args.data;
    let salt = args.salt;

    let result: ContractExecutionResult | CodeUploadResult | null = null;

    switch (decodedCall.value.type) {
      case "call":
        // @ts-ignore
        result = await api?.apis.ContractsApi.call(
          selectedAccount.address, // origin
          args.dest.value, // dest
          args.value, // value
          undefined, // gasLimit
          undefined, // storageDepositLimit
          data
        );
        break;

      case "instantiate_with_code":
        //@ts-ignore
        result = await api?.apis.ContractsApi.instantiate(
          selectedAccount.address, // origin
          args.value, // value
          undefined, // gasLimit
          undefined, // storageDepositLimit
          Enum("Upload", code),
          data,
          salt
        );
        break;

      case "upload_code":
        //@ts-ignore
        result = await api?.apis.ContractsApi.upload_code(
          selectedAccount.address, // origin
          code,
          undefined, // storageDepositLimit
          Enum("Enforced")
        );
        break;
    }
    setDryRunResult(result);
  };

  const sign = async () => {
    if (!tx) {
      setError("No transaction loaded.");
      return;
    } else if (!selectedAccount) {
      setError("No account selected.");
      return;
    }
    setSigning(true); // Disable button while signing.

    let maybeModifiedTx = null;

    if(isContract && useGasEstimates && dryRunResult) {
      const {
        type: pallet,
        value: { type: callName, value: args },
      } = tx.decodedCall

      if (tx?.decodedCall.value.type === "instantiate_with_code" || tx?.decodedCall.value.type === "call") {
        args.gas_limit.ref_time = dryRunResult.gas_required.ref_time;
        args.gas_limit.proof_size = dryRunResult.gas_required.proof_size;
        args.storage_deposit_limit = dryRunResult.storage_deposit.value;
        // @ts-ignore
        maybeModifiedTx = await api.tx[pallet][callName](args)

      } else if (tx.decodedCall.value.type === "upload_code") {
        args.deposit = dryRunResult.value.deposit;
        // @ts-ignore
        maybeModifiedTx = await api.tx[pallet][callName](args)
      }
    }

    let payload: HexString | null = null;

    try {
      if (maybeModifiedTx) {
        payload = await maybeModifiedTx?.sign(selectedAccount?.polkadotSigner as PolkadotSigner);
      } else {
        payload = await tx?.sign(selectedAccount?.polkadotSigner as PolkadotSigner);
      }
    } catch (err) {
      setSigning(false);
      console.log(err);
      setError("Cancelled");
      return;
    }


    try {
      let response = await submitData(payload?.toString());
      if (response.status === "success") {
        setModalConfig({
          title: "Signing Successful",
          message: "Pop CLI will submit the signed transaction. You can close the tab now.",
          confirmText: "Close Tab",
          confirmClass: "px-4 py-2 bg-pink-700 text-white rounded hover:bg-blue-500",
          showCancelButton: false,
          onConfirm: () => window.close(),
        });
        setIsModalOpen(true);
      } else {
        setError("An error occurred submitting the payload");
      }
    } catch (err) {
      setError("Unable to submit. Is the server closed?");
    } finally {
      setLoading(false);
    }
    setSigning(false);
  };

  // Render the UI
  return (
    <> {selectedAccount &&
      <div style={{ padding: "20px" }}>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        <div className="pb-3">
          <div className="font-semibold">Account:</div>
          <span>{selectedAccount?.address} </span>
        </div>
        <div>
          <div className="pb-3">
            <div className="font-semibold">RPC:</div>
            {rpc ? (
              <p>
                <a
                  href={`https://polkadot.js.org/apps/?rpc=${encodeURIComponent(rpc)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-700"
                >
                  {rpc}
                </a>
              </p>
            ) : (
              <p>No RPC loaded.</p>
            )}
          </div>

          <div className="pb-3">
            <div className="font-semibold">Extrinsic Info:</div>
            {tx ? (
              <div>
                <span className="text-gray-500">Pallet: </span>
                {tx.decodedCall.type} <br />
                <span className="text-gray-500">Dispatchable:</span> {tx?.decodedCall.value.type}
              </div>
            ) : (
              <p></p>
            )}
          </div>
        </div>

        {isContract && dryRunResult && (
          <div>
            <DryRun
              dryRunResult={dryRunResult}
              useGasEstimates={useGasEstimates}
              setUseGasEstimates={setUseGasEstimates}
              originalGas={tx?.decodedCall.value.value.gas_limit}
              callType={tx?.decodedCall.value.type}
              chainProperties={chainProperties}
            ></DryRun>
          </div>
        )}

        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
          <InfoIcon/>
          <p>Please review the transaction details <b>in your wallet before signing</b>.</p>
        </div>

        <div className="flex justify-center items-center space-x-4">
          <Button
            onClick={async () => await sign()}
            className="text-lg font-bold bg-pink-700 hover:bg-blue-500"
            disabled={signing}
          >
            Submit
          </Button>
          <Button
            onClick={handleTerminate}
            className="text-lg font-bold bg-violet-950 hover:bg-violet-800"
          >
            Cancel
          </Button>
        </div>

        <Modal
          isOpen={isModalOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          confirmClass={modalConfig.confirmClass}
          cancelText={modalConfig.cancelText}
          showCancelButton={modalConfig.showCancelButton}
          onConfirm={modalConfig.onConfirm}
          onCancel={modalConfig.onCancel}
        />
      </div>
    }</>
  );
};
