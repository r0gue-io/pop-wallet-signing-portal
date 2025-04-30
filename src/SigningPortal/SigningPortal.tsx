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
import { CostSummary } from "@/CostSummary"
import { calculateContractAddress } from "@/lib/contractAddress"

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
  const [isChainRegistrar, setIsChainRegistrar] = useState<boolean>(false);
  const [feesEstimation, setFeesEstimation] = useState<bigint>(0n);
  const [deposit, setDeposit] = useState<bigint>(0n);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [useGasEstimates, setUseGasEstimates] = useState<boolean>(true);
  const [chainProperties, setChainProperties] = useState<ChainProperties>({ss58Format: 42, tokenDecimals: 12, tokenSymbol: "UNIT"});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [balanceSelectedAccount, setBalanceSelectedAccount] = useState<bigint | null>(null);
  const [proxiedAccount, setProxiedAccount] = useState<string | null>(null);
  const [proxiedAccountBalance, setProxiedAccountBalance] = useState<bigint | null>(null);
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);

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

  const { selectedAccount } = useAccounts();

  // Helper function to check if a transaction is a Registrar reserve/register call
  const isRegistrarCall = (call: any): boolean => {
    return call?.type === "Registrar" && ["reserve", "register"].includes(call?.value?.type);
  };

  // Helper function to check if a wrapped call (Proxy or Sudo) is a Registrar call
  const isWrappedRegistrarCall = (type: string, value: any): boolean => {
    return (
      (type === "Proxy" && value?.type === "proxy" && isRegistrarCall(value?.value?.call)) ||
      (type === "Sudo" && value?.type === "sudo" && isRegistrarCall(value?.value?.call))
    );
  };

  // Check if the transaction is related to the Registrar pallet: reserve a parachain id or register a parachain. Either directly, via a Proxy, or a Sudo call.
  const isRegistrarTransaction = (tx: UnsafeTransaction<any, string, string, any>) => {
    if (!tx?.decodedCall) return false;
    return (
      isRegistrarCall(tx.decodedCall) || isWrappedRegistrarCall(tx.decodedCall.type, tx.decodedCall.value)
    );
  };


  // Fetch the payload on component mount
  useEffect(() => {
    const loadPayload = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPayload();
        if (result.chain_rpc.endsWith("/")){
          setRpc(result.chain_rpc.substring(0, result.chain_rpc.length - 1));
        } else {
          setRpc(result.chain_rpc);
        }
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

        let pallet = tx.decodedCall.type;
        let isContractPallet = pallet === "Contracts" || pallet === "Revive";
        setIsContract(isContractPallet);
        setIsChainRegistrar(isRegistrarTransaction(tx));
        
        // Automatically trigger dry run if it's a contract call
        if (isContractPallet) {
          dryRun(tx, api);
        }
        // Automatically trigger to calculate costs if it's a parachain reserve or a parachain registrar call
        if (isRegistrarTransaction(tx)) {
          calculateCosts(tx, api);
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
        // Extract properties & provide default values for missing ones
        let updatedProperties: ChainProperties = {
          ss58Format: chainSpec.properties.ss58Format ?? 42,
          tokenDecimals: chainSpec.properties.tokenDecimals ?? 12,
          tokenSymbol: chainSpec.properties.tokenSymbol ?? "UNIT",
        };

        setChainProperties(updatedProperties);
      }
    }

    loadChainProperties();
  }, [client]);

  useEffect(() => {
    const getSelectedAccountFreeBalance = async () => {
      // @ts-ignore
      api.query.System.Account.watchValue(selectedAccount?.address).subscribe((ev) => {
        setBalanceSelectedAccount(ev.data.free);
      });
    };
    if (api) {
      getSelectedAccountFreeBalance();
    }
  }, [api, selectedAccount]);

  // Re-run dry run if selected account changes
  useEffect(() => {
    if (isContract && tx && api) {
      dryRun(tx, api);
    }
  }, [selectedAccount, isContract, tx, api]);

  // Re-run calculate costs if selected account changes
  useEffect(() => {
    if (isChainRegistrar && tx && api) {
      calculateCosts(tx, api);
    }
  }, [selectedAccount, isChainRegistrar, tx, api]);

  const handleTerminate = async () => {
    setError(null);

    setModalConfig({
      title: "Cancel Signing",
      message: "Are you sure you want to cancel the signing? This will close the server and tab.",
      confirmText: "Yes, Cancel",
      cancelText: "Go Back",
      confirmClass: "px-4 py-2 bg-pink-700 text-white rounded hover:bg-blue-300 hover:text-gray-800",
      onConfirm: async () => {
        try {
          await terminate();
          window.close();
        } catch (err) {
          console.log(err);
          setError("Failed to terminate the server. Is it already closed?");
        }
        console.log("Server closed.");
        setIsModalOpen(false);
        setError("Browser prevented tab close. Please close manually.");
      },
      onCancel: () => setIsModalOpen(false),
    });
    setIsModalOpen(true);
  };

  const dryRun = async (tx: UnsafeTransaction<any, string, string, any>, api: UnsafeApi<any>) => {
    let decodedCall = tx?.decodedCall;
    const callType = decodedCall?.type;

    if (!selectedAccount || (callType !== "Contracts" && callType !== "Revive")) {
      return;
    }

    let args = decodedCall.value.value;
    let code = args.code;
    let data = args.data;
    let salt = args.salt;

    let result: ContractExecutionResult | CodeUploadResult | null = null;
    const selectedApi = callType === "Contracts" ? api?.apis.ContractsApi : api?.apis.ReviveApi;

    switch (decodedCall.value.type) {
      case "call":
        // @ts-ignore
        result = await selectedApi.call(
          selectedAccount.address, // origin
          callType === "Revive" ? args.dest : args.dest.value, // dest
          args.value, // value
          undefined, // gasLimit
          undefined, // storageDepositLimit
          data
        );
        break;

      case "instantiate_with_code":
        if (callType === "Revive") {
          const contractAddress = await calculateContractAddress(api, selectedAccount.address, code, data, salt);
          setContractAddress(contractAddress);
        }
        //@ts-ignore
        result = await selectedApi.instantiate(
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
        result = await selectedApi.upload_code(
          selectedAccount.address, // origin
          code,
          undefined, // storageDepositLimit
          callType === "Revive" ? undefined : Enum("Enforced")
        );
        break;
    }
    setDryRunResult(result);
  };

  // Extracts the actual Registrar call from the transaction registar, proxy, or sudo.
  const extractRegistrarCall = (tx: UnsafeTransaction<any, string, string, any>) => {
    let decodedCall = tx?.decodedCall;
    let decodedCallValue = decodedCall.value?.value;

    if (isRegistrarCall(decodedCall)) return decodedCall;
    if (decodedCall.type === "Proxy" && decodedCall.value?.type === "proxy") {
      let account = decodedCallValue.real.value;
      setProxiedAccount(account);
      // @ts-ignore
      api.query.System.Account.watchValue(account).subscribe((ev) => {
        setProxiedAccountBalance(ev.data.free);
      });
      return decodedCallValue.call;
    }
    if (decodedCall.type === "Sudo" && decodedCall.value?.type === "sudo") return decodedCallValue.call;

    return null;
  };

  const calculateCosts = async (tx: UnsafeTransaction<any, string, string, any>, api: UnsafeApi<any>) => {
    if (!selectedAccount || !isRegistrarTransaction(tx)) {
      return;
    }
    const registrarCall = extractRegistrarCall(tx);
    if (!registrarCall) return;

    let fees = await tx.getEstimatedFees(selectedAccount.address);
    setFeesEstimation(fees);

    let paraDepositConstant = await api.constants.Registrar.ParaDeposit();
    let dataDepositPerByteConstant = await api.constants.Registrar.DataDepositPerByte();
    let deposit: bigint = 0n;

    switch (registrarCall.value.type) {
      case "reserve":
        deposit = paraDepositConstant;
        break;

      case "register":
        let args = registrarCall.value.value;
        let genesisHead = args.genesis_head;
        // @ts-ignore
        let configuration = await api.query.Configuration.ActiveConfig.getValue();
        let max_code_size = configuration.max_code_size;
        deposit = paraDepositConstant + (dataDepositPerByteConstant * BigInt(genesisHead.asBytes().length)) + (dataDepositPerByteConstant * BigInt(max_code_size));
        break;
    }
    setDeposit(deposit);
    setIsChainRegistrar(true);
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
      let response = await submitData({
        signed_payload: payload?.toString(),
        contract_address: contractAddress,
      });
      if (response.status === "success") {
        setModalConfig({
          title: "Signing Successful",
          message: "Pop CLI will submit the signed transaction. You can close the tab now.",
          confirmText: "Close Tab",
          confirmClass: "px-4 py-2 bg-pink-700 text-white rounded hover:bg-blue-300 hover:text-gray-800",
          showCancelButton: false,
          onConfirm: () => {
            window.close()
            setIsModalOpen(false)
            setError("Browser prevented tab close. Please close manually.")
          },
          onCancel: () => setIsModalOpen(false),
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
      <div>
        {loading && <p>Loading...</p>}
        {error &&
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            {/*<ErrorIcon size={6}/>*/}
            <p>Error: {error}</p>
          </div>
        }

        <div className="pb-3">
          <div className="font-semibold">Account:</div>
          <span>{selectedAccount?.address} </span>
        </div>
        <div>
          <div className="pb-3">
            <div className="font-semibold">RPC: <span className="font-light text-black">{rpc}</span></div>
            {rpc ? (
              <p>
                <a
                  href={`https://polkadot.js.org/apps/?rpc=${encodeURIComponent(rpc)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-pink-700"
                >
                  polkadot.js.org
                </a>
                <span className="pr-2 pl-2">|</span>
                <a
                  href={`https://dev.papi.how/explorer#networkId=custom&endpoint=${encodeURIComponent(rpc)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-pink-700"
                >
                  dev.papi.how
                </a>
              </p>
            ) : (
              <p>No RPC loaded.</p>
            )}
          </div>

          <div className="pb-3">
            <div className="font-semibold pb-2">Extrinsic Info:</div>
            {tx ? (
              <React.Fragment>
              <div className="flex flex-wrap gap-x-4">
                <div className="bg-gray-100 rounded p-1 border border-gray-200 font-bold">
                  <span className="text-gray-600 font-light">Pallet:</span> {tx.decodedCall.type}
                </div>
                <div className="bg-gray-100 rounded p-1 border border-gray-200 font-bold">
                  <span className="text-gray-600 font-light">Dispatchable:</span> {tx.decodedCall.value.type}
                </div>
              </div>
              {proxiedAccount && (
                <div className="mt-2">
                  <div className="text-gray-700 font-medium pb-1">Executing on behalf of:</div>
                  <div className="bg-gray-50 rounded p-2 border border-gray-200 font-medium">
                    <span className="text-gray-600 font-normal">Proxied Account:</span> {proxiedAccount}
                  </div>
                </div>
              )}
              { isWrappedRegistrarCall(tx.decodedCall.type, tx.decodedCall.value) && (
                 <div className="mt-2 pl-4 border-l-2 border-gray-300">
                  <div className="text-gray-700 font-medium pb-1">Underlying Call:</div>
                    <div className="flex flex-wrap gap-x-4">
                    <div className="bg-gray-100 rounded p-1 border border-gray-200 font-bold">
                      <span className="text-gray-600 font-light">Pallet:</span> {tx.decodedCall.value?.value?.call.type}
                    </div>
                    <div className="bg-gray-100 rounded p-1 border border-gray-200 font-bold">
                      <span className="text-gray-600 font-light">Dispatchable:</span> {tx.decodedCall.value?.value?.call.value.type}
                    </div>
                  </div>
                </div>
                )}
                {isChainRegistrar && (
                  <CostSummary 
                    fees={feesEstimation} 
                    deposit={deposit} 
                    accountBalance={balanceSelectedAccount as bigint}
                    chainProperties={chainProperties}
                    proxiedAccountBalance={proxiedAccountBalance ?? undefined}
                  />
                )}
              </React.Fragment>
            ) : (
              <p></p>
            )}
          </div>

        </div>

        {isContract && dryRunResult && rpc && (
          <div>
            <DryRun
              dryRunResult={dryRunResult}
              useGasEstimates={useGasEstimates}
              setUseGasEstimates={setUseGasEstimates}
              originalGas={tx?.decodedCall.value.value.gas_limit}
              callType={tx?.decodedCall.value.type}
              chainProperties={chainProperties}
              rpc={rpc}
            ></DryRun>
          </div>
        )}

        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <InfoIcon />
              <span className="ml-2 font-extrabold">Note</span>
            </div>
          </div>
          <div className="mt-2">
            <p>Please review the transaction details <b>in your wallet before signing</b>.</p>
          </div>
        </div>

        <div className="flex justify-center items-center space-x-4">
          <Button
            onClick={async () => await sign()}
            className="text-lg font-bold bg-pink-700 hover:bg-blue-300 hover:text-gray-800"
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
