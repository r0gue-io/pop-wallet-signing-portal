// Copyright 2022-2024 use-ink/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { Binary } from "polkadot-api";
import React from "react"

export interface CodeUploadResult {
  type?: string;
  success?: boolean,
  value?: {
    value?: any;
    type?: string;
      code_hash: Binary,
      deposit: bigint
  };
}

export interface ContractExecutionResult {
  gas_consumed: {
    ref_time: bigint;
    proof_size: number;
  };
  gas_required: {
    ref_time: bigint;
    proof_size: number;
  };
  storage_deposit: {
    type: string;
    value: bigint;
  };
  debug_message: Binary;
  events: any[];
  result: {
    success: boolean;
    value: {
      account_id: string;
      value?: {type: string, value: any};
      type?: string
    };
    flags: number;
    data: Binary;
  };
}

interface DryRunProps {
  dryRunResult: ContractExecutionResult | CodeUploadResult;
  callType: string | undefined;
  useGasEstimates: boolean;
  setUseGasEstimates: (value: boolean) => void;
  originalGas: {ref_time: bigint, proof_size: number}
}

// CodeUpload Component
const CodeUpload: React.FC<{ result: CodeUploadResult,  setSuccess: (value: boolean) => void }> = ({ result , setSuccess}) => {

  const isSuccess = (result: CodeUploadResult) => {
    setSuccess(result.success || false); // Ensure setSuccess is called with a boolean value
    return result.success;
  };

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold">Code Upload Result</h3>
      {/* Result Status */}
      {isSuccess(result) ? (
        <div>
          <div className="text-sm bg-gray-200 p-2 rounded">
            <p>Code Hash: {result.value?.code_hash.asHex()}</p>
            <p>Storage Deposit: {result.value?.deposit.toString()}</p>
          </div>
          <div className="text-green-600 font-bold flex items-center">
            The call will be successful.
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm bg-gray-200 p-2 rounded">
            <p>Result: {result.value?.value.value.type}</p>
          </div>
          <div className="text-red-600 font-bold flex items-center">
            The call will not be successful.
          </div>
        </div>
      )}
    </div>
  );
};

// ContractExecution Component
const ContractExecution: React.FC<{ result: ContractExecutionResult, originalGas: {ref_time: bigint, proof_size: number}, useGasEstimates: boolean, setSuccess: (value: boolean) => void}> = ({ result, originalGas, useGasEstimates, setSuccess}) => {

  const isSuccess = (result: ContractExecutionResult) => {
    const success = result.result?.success &&
      (useGasEstimates || isOriginalGasSufficient(originalGas, result.gas_required));
    setSuccess(success || false); // Ensure setSuccess is called with a boolean value
    return success;
  };

  return (
    <div>
      {/* Gas Estimates */}
      {result.gas_consumed && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Gas Consumed</h3>
          <div className="flex space-x-4 text-sm">
            <div className="bg-gray-200 p-2 rounded shadow-sm">
              <p>Ref Time</p>
              <p>{result.gas_consumed.ref_time.toString()} ns</p>
            </div>
            <div className="bg-gray-200 p-2 rounded shadow-sm">
              <p>Proof Size</p>
              <p>{result.gas_consumed.proof_size.toString()} bytes</p>
            </div>
          </div>
        </div>
      )}

      {result.gas_required && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Gas Required</h3>
          <div className="flex space-x-4 text-sm">
            <div className="bg-gray-200 p-2 rounded shadow-sm">
              <p>Ref Time</p>
              <p>{result.gas_required.ref_time.toString()} ns</p>
            </div>
            <div className="bg-gray-200 p-2 rounded shadow-sm">
              <p>Proof Size</p>
              <p>{result.gas_required.proof_size.toString()} bytes</p>
            </div>
          </div>
        </div>
      )}

      {/* Storage Deposit */}
      {result.storage_deposit && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Storage Deposit</h3>
          <div className="bg-gray-200 p-2 rounded shadow-sm text-sm">
            {result.storage_deposit.type}: {result.storage_deposit.value.toString()}
          </div>
        </div>
      )}


      {/* Detailed Result Info */}
      {result.result && result.result.value?.value?.type && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Result Details</h3>
          <div className="text-sm bg-gray-200 p-2 rounded">
            <p>Type: {result.result.value?.type}</p>
            {result.result.value.value && (
              <p>Sub-Type: {result.result.value.value.type}</p>
            )}
            {result.result.value.value !== undefined && (
              <p>Value: {JSON.stringify(result.result.value.value.value)}</p>
            )}
          </div>
        </div>
      )}

      {/* Debug Message */}
      {(result.debug_message && result.debug_message.asText() != "") && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Debug Message</h3>
          <p className="text-sm bg-gray-200 p-2 rounded">
            {result.debug_message.asText()}
          </p>
        </div>
      )}

      {/* Result Status */}
      {isSuccess(result) ? (
        <div className="text-green-600 font-bold flex items-center">
          The call will be successful.
        </div>
      ) : (
        <div className="text-red-600 font-bold flex items-center">
          The call will not be successful. {result.result?.success && !useGasEstimates && "Not enough gas provided (use estimates)"}
        </div>
      )}
    </div>
  );
};

export function DryRun({
                         dryRunResult,
                         useGasEstimates,
                         setUseGasEstimates,
                         callType,
                         originalGas
                       }: DryRunProps): JSX.Element {

  const [success, setSuccess] = React.useState(false);
  const [dryRunOpen, setDryRunOpen] = React.useState(false);

  return (
    <div className="space-y-5 pb-6">
      {/* Preline Alert for Success */}
      <div
        className=" bg-gray-100 border border-gray-200 rounded-lg shadow-lg p-4 dark:bg-neutral-800 dark:border-neutral-700"
        role="alert"
        tabIndex={-1}
        aria-labelledby="hs-dry-run-success"
      >
        <div className="flex items-center justify-between">
          {/* Left side with drop arrow */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="w-6 h-6 flex justify-center items-center p-1 bg-gray-200 rounded-full dark:bg-gray-700"
              onClick={() => setDryRunOpen(!dryRunOpen)}
            >
              <DropdownArrow isOpen={dryRunOpen} />

            </button>
            <h3 id="hs-dry-run-success" className="text-gray-800 font-semibold dark:text-white">
              Dry-run Outcome
            </h3>
          </div>
          {/* Right side with success/error icon */}
          <div className="shrink-0">
            {success ? <SuccessIcon /> : <ErrorIcon />}
          </div>
        </div>

        <div
          className={`
          flex 
          overflow-hidden 
          transition-all 
          duration-300 
          ease-in-out 
          ${dryRunOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ms-3">
              <div
                className={`
              mt-4 
              transition-all 
              duration-300 
              ease-in-out 
              transform 
              ${dryRunOpen ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"}
            `}
            >
              {callType === "upload_code" ? (
                <CodeUpload result={dryRunResult as CodeUploadResult} setSuccess={setSuccess} />
              ) : (
                <ContractExecution
                  result={dryRunResult as ContractExecutionResult}
                  originalGas={originalGas}
                  useGasEstimates={useGasEstimates}
                  setSuccess={setSuccess}
                />
              )}
            </div>
          </div>
        </div>
        {/* Toggle for Use Gas Estimates */}
        <div className="flex items-center mt-4 space-x-2">
          <div
            className={`w-12 h-6 flex items-center cursor-pointer rounded-full p-1 duration-300 ease-in-out ${
              useGasEstimates ? "bg-blue-500" : "bg-gray-300"
            }`}
            onClick={() => setUseGasEstimates(!useGasEstimates)}
          >
            <div
              className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
                useGasEstimates ? "translate-x-6" : "translate-x-0"
              }`}
            ></div>
          </div>
          <span className="text-sm font-medium">Use Gas Estimates in Call</span>
        </div>
      </div>


    </div>
  );
}


const DropdownArrow = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-4 h-4 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
)

//@ts-ignore
const SuccessIcon = () => (
  <span
    className="inline-flex justify-center items-center size-10 rounded-full border-4 border-teal-100 bg-teal-200 text-teal-800 dark:border-teal-900 dark:bg-teal-800 dark:text-teal-400">
              <svg
                className="shrink-0 size-6"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </span>
)

const ErrorIcon = () => (
  <span
    className="inline-flex justify-center items-center size-10 rounded-full border-4 border-red-100 bg-red-200 text-red-800 dark:border-red-900 dark:bg-red-800 dark:text-red-400">
  <svg
    className="shrink-0 size-6"
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
</span>

)

//@ts-ignore
const InfoIcon = () => (
  <svg
    className="shrink-0 size-4 text-blue-600 mt-1"
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx={12} cy={12} r={10} />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>

)

// TODO: need to get decimals of chain
//@ts-ignore
function formatBigIntToUnit(value: bigint, decimals: number): string {
  const factor = BigInt(10 ** decimals)
  const formattedValue = value * factor / BigInt(1000000)

  // Convert the formatted value into a string with a fixed number of decimal places
  const integerPart = formattedValue / factor
  const decimalPart = formattedValue % factor

  const decimalString = decimalPart.toString().padStart(decimals, "0").slice(0, decimals)
  return `${integerPart}.${decimalString}`
}

function isOriginalGasSufficient(originalGas: { ref_time: bigint, proof_size: number }, gasRequired: {
  ref_time: bigint,
  proof_size: number
}): boolean {
  return originalGas?.ref_time >= gasRequired.ref_time && originalGas?.proof_size >= gasRequired.proof_size;
}
