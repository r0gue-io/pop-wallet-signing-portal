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
export const SigningPortal: React.FC = () => {
  const { fetchPayload, submitData } = useBackendAPI();

  const [_client, setClient] = useState<PolkadotClient | null>(null);
  const [_api, setApi] = useState<UnsafeApi<any> | null>(null);
  const [_originalCallData, setOriginalCallData] = useState<Uint8Array | null>(null);
  const [_callData, setCallData] = useState<Binary | null>(null);
  const [tx, setTx] = useState<UnsafeTransaction<any, string, string, any> | null>(null);
  const [rpc, setRpc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);

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

  // Handlers for API calls
  // const handleSubmit = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const result = await submitData({ key: "value" });
  //     setResponse(result);
  //   } catch (err) {
  //     setError((err as Error).message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleErrorReport = async () => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const result = await reportError({ error: "Something went wrong" });
  //     setResponse(result);
  //   } catch (err) {
  //     setError((err as Error).message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleTerminate = async () => {
    setLoading(true);
    setError(null);
    try {
      // const result = await terminate();
      // setResponse(result);
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
      setResponse("Signed payload successfully sent to Pop CLI. Server will close now.")
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
        {tx ? <div><span style={{color: "gray"}}>Pallet: </span>{tx.decodedCall.type} <br/>
          <span style={{color:"gray"}}>Dispatchable:</span> {tx?.decodedCall.value.type}</div> : <p></p>}
      </div>


      <Button onClick={async () => await sign()}>Sign</Button>
      <Button onClick={handleTerminate} className="m-2" style={{backgroundColor:"red"}}>
        Terminate
      </Button>

      <div>
        {response ? <p>{JSON.stringify(response, null, 2)}</p> : <p></p>}
      </div>
    </div>
  );
};