// Copyright 2022-2024 use-ink/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { Binary } from "polkadot-api";
import React from "react"
import { ChevronDown } from "@/components/ui/chevron-down.tsx"
import { ChainProperties, formatCurrency} from "@/lib/utils.ts"

export interface CodeUploadResult {
  type?: string;
  success?: boolean,
  value?: {
    value?: any;
    type?: string;
      code_hash: Binary,
      deposit: bigint | null
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
  chainProperties: ChainProperties;
  rpc: string;
}

// CodeUpload Component
const CodeUpload: React.FC<{ result: CodeUploadResult,  setSuccess: (value: boolean) => void , chainProperties: ChainProperties, rpc: string}> = ({ result , setSuccess, chainProperties, rpc}) => {
  const isSuccess = (result: CodeUploadResult): boolean => {
    return result.success as boolean;
  };

  React.useEffect(() => {
    const success = isSuccess(result);
    setSuccess(success);
  }, [result, setSuccess]);

  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold">Code Upload Result</h3>
      {/* Result Status */}
      {isSuccess(result) ? (
        <div>
          <div className="text-sm bg-gray-200 p-2 pb-4 rounded">
            <p>Code Hash: {result.value?.code_hash.asHex()}</p>
          </div>
          <div className="mb-4">
            <h3 className="text-md font-semibold">Storage Deposit</h3>
            <div className="bg-gray-200 p-2 rounded text-sm">
              {formatCurrency(result.value?.deposit as bigint, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}
            </div>
          </div>
          <div className="text-green-600 font-bold flex items-center">
            The call will be successful.
          </div>
        </div>
      ) : (
        <div>
          <div className="text-red-700 font-medium flex flex-col gap-2">
            <span>The call will not be successful.</span>
            {result?.value?.value?.value?.type === "AccountUnmapped" && (
              <div>
                <span>This account is not currently mapped.</span>
                <span className="mt-1">You can map it by running the following command:</span>
                <pre className="bg-red-50 text-red-800 text-sm p-3 mt-2 rounded-md border border-red-200 whitespace-pre-wrap break-words">
                  pop call chain --pallet Revive --function map_account --url {rpc} --use-wallet
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ContractExecution Component
const ContractExecution: React.FC<{ result: ContractExecutionResult, originalGas: {ref_time: bigint, proof_size: number}, useGasEstimates: boolean, setSuccess: (value: boolean) => void, chainProperties: ChainProperties, rpc: string}> = ({ result, originalGas, useGasEstimates, setSuccess, chainProperties, rpc}) => {

  const isSuccess = (result: ContractExecutionResult) => {
    return result.result?.success &&
      (useGasEstimates || isOriginalGasSufficient(originalGas, result.gas_required));
  };

  // Use useEffect to update success state
  React.useEffect(() => {
    const success = isSuccess(result);
    setSuccess(success);
  }, [result, useGasEstimates, originalGas, setSuccess]);

  return (
    <div>
      {/* Gas Estimates */}
      {(result.gas_consumed || result.gas_required) && (
        <div className="flex space-x-4 mb-4">
          {result.gas_consumed && (
            <div className="flex-1">
              <h3 className="text-md font-semibold">Gas Consumed</h3>
              <div className="flex space-x-4 text-sm">
                <div className="bg-gray-200 p-2 rounded">
                  <p>Ref Time</p>
                  <p>{picoToMilli(result.gas_consumed.ref_time)}</p>
                </div>
                <div className="bg-gray-200 p-2 rounded">
                  <p>Proof Size</p>
                  <p>{bytesToKB(result.gas_consumed.proof_size)} KB</p>
                </div>
              </div>
            </div>
          )}
          {result.gas_required && (
            <div className="flex-1">
              <h3 className="text-md font-semibold">Gas Required</h3>
              <div className="flex space-x-4 text-sm">
                <div className="bg-gray-200 p-2 rounded">
                  <p>Ref Time</p>
                  <p>{picoToMilli(result.gas_required.ref_time)}</p>
                </div>
                <div className="bg-gray-200 p-2 rounded">
                  <p>Proof Size</p>
                  <p>{bytesToKB(result.gas_required.proof_size)} KB</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Storage Deposit */}
      {result.storage_deposit && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Storage Deposit</h3>
          <div className="bg-gray-200 p-2 rounded text-sm">
            {result.storage_deposit.type}: {formatCurrency(result.storage_deposit.value, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}
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
         <div className="text-red-700 font-medium flex flex-col gap-2">
            <span>The call will not be successful.</span>
        
            {result.result?.success && !useGasEstimates && (
              <span>Not enough gas. Try using estimates.</span>
            )}

            {result.result?.value?.value?.value?.type === "AccountUnmapped" && (
              <div>
                <span>Account not mapped. </span>
                <span className="mt-1">You can map it by running the following command:</span>
                <pre className="bg-red-50 text-red-800 text-sm p-3 mt-2 rounded-md border border-red-200 whitespace-pre-wrap break-words">
                  pop call chain --pallet Revive --function map_account --url {rpc} --use-wallet
                </pre>
              </div>
            )}
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
                         originalGas,
                         chainProperties,
                         rpc,
                       }: DryRunProps): JSX.Element {

  const [success, setSuccess] = React.useState(false);
  const [dryRunOpen, setDryRunOpen] = React.useState(false);

  return (
    <div className="space-y-5 pb-6">
      {/* Preline Alert for Success */}
      <div
        className=" bg-gray-100 border border-gray-200 rounded-lg p-4 dark:bg-neutral-800 dark:border-neutral-700"
        role="alert"
        tabIndex={-1}
        aria-labelledby="hs-dry-run-success"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="w-6 h-6 flex justify-center items-center p-1 bg-gray-200 rounded-full dark:bg-gray-700"
              onClick={() => setDryRunOpen(!dryRunOpen)}
            >
              <ChevronDown isOpen={dryRunOpen} className=""/>

            </button>
            <h3 id="hs-dry-run-success" className="cursor-pointer text-gray-800 font-semibold dark:text-white"  onClick={() => setDryRunOpen(!dryRunOpen)}>
              Dry-run Outcome
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {success ? (
              <div className="flex items-center space-x-2">

                <span className="text-green-600 dark:text-green-400 font-medium">succeeds</span>
                <SuccessIcon />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-red-600 dark:text-red-400 font-medium">fails</span>
                <ErrorIcon size={8}/>
              </div>
            )}
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
                <CodeUpload result={dryRunResult as CodeUploadResult} setSuccess={setSuccess} chainProperties={chainProperties} rpc={rpc}/>
              ) : (
                <ContractExecution
                  result={dryRunResult as ContractExecutionResult}
                  originalGas={originalGas}
                  useGasEstimates={useGasEstimates}
                  setSuccess={setSuccess}
                  chainProperties={chainProperties}
                  rpc={rpc}
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
              className={`w-4 h-4 bg-white rounded-full transform duration-300 ease-in-out ${
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

//@ts-ignore
export const SuccessIcon = () => (
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

export const ErrorIcon = ({size}: {size: number}) => (
  <span
    className={`inline-flex justify-center items-center size-${size} rounded-full border-4 border-red-100 bg-red-200 text-red-800 dark:border-red-900 dark:bg-red-800 dark:text-red-400`}>
  <svg
    className={`shrink-0 size-${size-2}`}
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
export const InfoIcon = () => (
  <svg
    className="shrink-0 size-6 text-blue-600 mt-1 mb-2"
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

// convert picoseconds to milliseconds
function picoToMilli(pico: bigint): string {
  // pico / 1e9 = MS
  const divisor = 1_000_000_000n;
  const whole = pico / divisor;
  const fraction = pico % divisor;

  // Convert to string with precise decimal placement
  const wholeStr = whole.toString();
  const fracStr = (fraction / 1_000_000_0n).toString().padStart(2, '0');

  return `${wholeStr}.${fracStr} ms`;
}

  function bytesToKB(bytes: Number) {
    return Math.trunc(Number(bytes) / 1024 * 100) / 100;
  }


function isOriginalGasSufficient(originalGas: { ref_time: bigint, proof_size: number }, gasRequired: {
  ref_time: bigint,
  proof_size: number
}): boolean {
  return originalGas?.ref_time >= gasRequired.ref_time && originalGas?.proof_size >= gasRequired.proof_size;
}
