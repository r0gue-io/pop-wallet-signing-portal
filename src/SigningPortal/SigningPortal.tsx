import React, { useEffect, useState } from "react"
import useBackendAPI from "../api/useBackendAPI"
import { createClient, PolkadotClient, Binary, UnsafeTransaction, UnsafeApi, HexString } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/web"

export const SigningPortal: React.FC = () => {
  const { fetchPayload, submitData, reportError, terminate } = useBackendAPI();

  const [client, setClient] = useState<PolkadotClient | null>(null);
  const [api, setApi] = useState<UnsafeApi<any> | null>(null);
  const [originalCallData, setOriginalCallData] = useState<Uint8Array | null>(null);
  const [callData, setCallData] = useState<Binary | null>(null);
  const [tx, setTx] = useState<UnsafeTransaction<any, string, string, any> | null>(null);
  const [rpc, setRpc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);

  // Fetch the payload on component mount
  useEffect(() => {
    const loadPayload = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPayload();
        setRpc(result.chain_rpc)
        setOriginalCallData(result.call_data)
        let client = createClient(getWsProvider(result.chain_rpc));
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
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await submitData({ key: "value" });
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleErrorReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reportError({ error: "Something went wrong" });
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await terminate();
      setResponse(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Render the UI
  return (
    <div style={{ padding: "20px" }}>
      <h1>Backend API Integration</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div>
        <h2>Chain RPC:</h2>
        {rpc ? <p>{rpc}</p> : <p>No RPC loaded.</p>}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleSubmit} style={{ marginRight: "10px" }}>
          Submit Data
        </button>
        <button onClick={handleErrorReport} style={{ marginRight: "10px" }}>
          Report Error
        </button>
        <button onClick={handleTerminate}>
          Terminate
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Response:</h2>
        {response ? <pre>{JSON.stringify(response, null, 2)}</pre> : <p>No response yet.</p>}
      </div>
    </div>
  );
};