import { useCallback } from "react";

export interface TransactionData {
  chain_rpc: string;
  call_data: Uint8Array;
}

export interface Response {
  status: string
}

// Define types for API responses
type SubmitResponse = Response;

// Define the base URL for the backend.
const BASE_URL = "";

const useBackendAPI = () => {
  const fetchPayload = useCallback(async (): Promise<TransactionData> => {
    const response = await fetch(`${BASE_URL}/payload`);
    if (!response.ok) throw new Error("Failed to fetch payload");
    return response.json();
  }, []);

  const submitData = useCallback(
    async (data: string | undefined): Promise<SubmitResponse> => {
      const response = await fetch(`${BASE_URL}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit data");
      return response.json();
    },
    []
  );

  const reportError = useCallback(
    async (errorData: Record<string, unknown>)=> {
      const response = await fetch(`${BASE_URL}/error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorData),
      });
      if (!response.ok) throw new Error("Failed to report error");
    },
    []
  );

  const terminate = useCallback(async () => {
    const response = await fetch(`${BASE_URL}/terminate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to terminate");
  }, []);

  return {
    fetchPayload,
    submitData,
    reportError,
    terminate,
  };
};

export default useBackendAPI;
