import React, { useEffect, useState } from "react"
import useBackendAPI from "../api/useBackendAPI"
import {
  createClient,
  PolkadotClient,
  Binary,
  UnsafeTransaction,
  UnsafeApi,
  HexString,
  PolkadotSigner,
} from "polkadot-api"
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat"
import { getWsProvider } from "polkadot-api/ws-provider/web"
import { useSelectedAccount } from "@/context"
import { Button } from "@/components/ui/button.tsx"
import { CloseTabModal } from "@/CloseTabModal"
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
  const [close, setClose] = useState<string | null>(null);

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
        console.log(tx.decodedCall)
      } catch (err) {
        console.log(err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadPayload();
  }, [fetchPayload]);

  const handleTerminate = async () => {
    setLoading(true);
    setError(null);
    try {
      await terminate();
      setClose("Pop CLI server closed. You may now close this tab.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sign = async () => {
    const payload = await tx?.sign(selectedAccount?.polkadotSigner as PolkadotSigner);

    let response = await submitData(payload?.toString());
    if (response.status === "success") {
      setClose("Transaction submitted to Pop CLI server. You may now close this tab safely and go back to your terminal.");
    } else {
      setError("An error occurred submitting the payload");
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


      <Button onClick={async () => await sign()}>Sign</Button>
      <Button onClick={handleTerminate} className="m-2 col bg-red-500" >
        Terminate
      </Button>

      {close ? <CloseTabModal message={close}/> : <></>}
    </div>
  );
};