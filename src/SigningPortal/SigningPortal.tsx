import React, { useEffect, useState } from "react"
import useBackendAPI from "../api/useBackendAPI"
import {
  createClient,
  PolkadotClient,
  Binary,
  UnsafeTransaction,
  UnsafeApi,
  HexString,
  PolkadotSigner, Enum,
} from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { useSelectedAccount } from "@/context"
import { Button } from "@/components/ui/button.tsx"
import { Modal } from "@/Modal"
import { DryRun } from "@/DryRun"
export const SigningPortal: React.FC = () => {
  const { fetchPayload, submitData, terminate } = useBackendAPI();

  const [_client, setClient] = useState<PolkadotClient | null>(null);
  const [_api, setApi] = useState<UnsafeApi<any> | null>(null);
  const [_originalCallData, setOriginalCallData] = useState<Uint8Array | null>(null);
  const [_callData, setCallData] = useState<Binary | null>(null);
  const [tx, setTx] = useState<UnsafeTransaction<any, string, string, any> | null>(null);
  const [rpc, setRpc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isContract, setIsContract] = useState<boolean>(false);
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [useGasEstimates, setUseGasEstimates] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const selectedAccount = useSelectedAccount()


  // Fetch the payload on component mount
  useEffect(() => {
    const loadPayload = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPayload();
        setRpc(result.chain_rpc)
        setOriginalCallData(result.call_data)
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
        console.log(tx.decodedCall)
      } catch (err) {
        console.log(err);
        setError("Failed to connect to server or fetch data");
      } finally {
        setLoading(false);
      }
    };

    loadPayload();
  }, [fetchPayload]);

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
          window.close()
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

  const dryRun = async () => {
    // let inkClient = getInkClient(withPolkadotSdkCompat(getWsProvider(rpc)));
    console.log("***here");
    let code = tx?.decodedCall.value.value.code;
    let data = tx?.decodedCall.value.value.data;
    let salt = Binary.fromText("salt 100");
    console.log("***before instantiate");

    // @ts-ignore
    let result = await _api?.apis.ContractsApi.instantiate(
      selectedAccount.address, // origin
      0n, // value
      undefined, // gasLimit
      undefined, // storagedepositlimit
      Enum("Upload", code),
      data,
      salt,
    )
    setDryRunResult(result);
    console.log(result)
  }

  const sign = async () => {
    if (!tx) {
      setError("No transaction loaded.");
      return;
    } else if (!selectedAccount) {
      setError("No account selected.");
      return;
    }

    const payload = await tx?.sign(selectedAccount?.polkadotSigner as PolkadotSigner);

    try {
      let response = await submitData(payload?.toString());
      if (response.status === "success") {
        setModalConfig({
          title: "Signing Successful",
          message: "Pop CLI will submit the signed transaction. You can close the tab now.",
          confirmText: "Close Tab",
          confirmClass: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-300",
          showCancelButton: false,
          onConfirm: () => window.close(),
        });
        setIsModalOpen(true);
      } else {
        setError("An error occurred submitting the payload");
      }
    } catch(err) {
      setError("Unable to submit. Is the server closed?")
    } finally {
      setLoading(false);
    }
  }

  // Render the UI
  return (
    <div style={{ padding: "20px" }}>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div className="font-semibold">Account:</div>
      <span>{selectedAccount?.address} </span>
      <div>
        <div className="font-semibold">RPC:</div>
        {rpc ? <p>{rpc}</p> : <p>No RPC loaded.</p>}

        <div className="font-semibold">Extrinsic Info:</div>
        {tx ? <div><span className="text-gray-500">Pallet: </span>{tx.decodedCall.type} <br/>
          <span className="text-gray-500">Dispatchable:</span> {tx?.decodedCall.value.type}</div> : <p></p>}
      </div>

      {isContract && dryRunResult &&
        <div>
          <DryRun dryRunResult={dryRunResult} useGasEstimates={useGasEstimates} setUseGasEstimates={setUseGasEstimates}></DryRun>

        </div>
      }


      <Button onClick={async () => await dryRun()} className="m-2 col bg-blue-600">dry run</Button>
      <Button onClick={async () => await sign()} className="m-2 col bg-blue-600">Sign</Button>
      <Button onClick={handleTerminate}   className="m-1 px-2 py-1 text-sm bg-gray-400 hover:bg-red-500"
      >
       Cancel
      </Button>

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
  );
};