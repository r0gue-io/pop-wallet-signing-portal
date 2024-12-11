import { useCallback } from "react";

export interface TransactionData {
  chain_rpc: string;
  call_data: Uint8Array;
}

// Define types for API responses
type SubmitResponse = string;
type ErrorReportResponse = Record<string, unknown>;
type TerminateResponse = Record<string, unknown>;

// Define the base URL for the backend
const BASE_URL = "http://localhost:9090";

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
    async (errorData: Record<string, unknown>): Promise<ErrorReportResponse> => {
      const response = await fetch(`${BASE_URL}/error`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorData),
      });
      if (!response.ok) throw new Error("Failed to report error");
      return response.json();
    },
    []
  );

  const terminate = useCallback(async (): Promise<TerminateResponse> => {
    const response = await fetch(`${BASE_URL}/terminate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to terminate");
    return response.json();
  }, []);

  return {
    fetchPayload,
    submitData,
    reportError,
    terminate,
  };
};

export default useBackendAPI;
