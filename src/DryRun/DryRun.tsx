// Copyright 2022-2024 use-ink/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import { Binary } from "polkadot-api";

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
      value?: {type: string};
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
const CodeUpload: React.FC<{ result: CodeUploadResult }> = ({ result }) => {
  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold">Code Upload Result</h3>
      {/* Result Status */}
      {result.success ? (
        <div>
          <div className="text-sm bg-gray-100 p-2 rounded">
            <p>Code Hash: {result.value?.code_hash.asHex()}</p>
            <p>Storage Deposit: {result.value?.deposit.toString()}</p>
          </div>
          <div className="text-green-600 font-bold flex items-center">
            The call will be successful.
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm bg-gray-100 p-2 rounded">
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
const ContractExecution: React.FC<{ result: ContractExecutionResult, originalGas: {ref_time: bigint, proof_size: number}, useGasEstimates: boolean }> = ({ result, originalGas, useGasEstimates}) => {
  return (
    <div>
      {/* Gas Estimates */}
      {result.gas_consumed && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Gas Consumed</h3>
          <div className="flex space-x-4 text-sm">
            <div className="bg-gray-100 p-2 rounded shadow-sm">
              <p>Ref Time</p>
              <p>{result.gas_consumed.ref_time.toString()} ns</p>
            </div>
            <div className="bg-gray-100 p-2 rounded shadow-sm">
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
            <div className="bg-gray-100 p-2 rounded shadow-sm">
              <p>Ref Time</p>
              <p>{result.gas_required.ref_time.toString()} ns</p>
            </div>
            <div className="bg-gray-100 p-2 rounded shadow-sm">
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
          <div className="bg-gray-100 p-2 rounded shadow-sm text-sm">
            {result.storage_deposit.type}: {result.storage_deposit.value.toString()}
          </div>
        </div>
      )}

      {/* Contract Address */}
      <div className="mb-4">
        <h3 className="text-md font-semibold">Contract Address</h3>
        <div className="bg-gray-100 p-2 rounded shadow-sm text-sm">
          {result.result?.success && result.result.value?.account_id
            ? result.result.value.account_id
            : "None"}
        </div>
      </div>

      {/* Detailed Result Info */}
      {result.result && result.result.value?.value?.type && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Result Details</h3>
          <div className="text-sm bg-gray-100 p-2 rounded">
            <p>Type: {result.result.value.type}</p>
            {result.result.value.value && (
              <p>Sub-Type: {result.result.value.value.type}</p>
            )}
            {result.result.value.value?.value !== undefined && (
              <p>Value: {JSON.stringify(result.result.value.value.value)}</p>
            )}
          </div>
        </div>
      )}

      {/* Debug Message */}
      {result.debug_message && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Debug Message</h3>
          <p className="text-sm bg-gray-100 p-2 rounded">
            {result.debug_message.asText()}
          </p>
        </div>
      )}

      {/* Result Status */}
      {result.result?.success && (useGasEstimates || isOriginalGasSufficient(originalGas, result.gas_required)) ? (
        <div className="text-green-600 font-bold flex items-center">
          The call will be successful.
        </div>
      ) : (
        <div className="text-red-600 font-bold flex items-center">
          The call will not be successful. {result.result?.success && !useGasEstimates && "Not enough gas provided."}
        </div>
      )}
    </div>
  );
};

// Main DryRun Component
export function DryRun({ dryRunResult, useGasEstimates, setUseGasEstimates, callType, originalGas}: DryRunProps): JSX.Element {
  return (
    <div className="dry-run-outcome bg-white shadow-md rounded-md p-4">
      <h2 className="text-lg font-bold mb-4">Dry-run Outcome</h2>

      {/* Render the appropriate result */}
      {(callType === "upload_code") ? (
        <CodeUpload result={dryRunResult as CodeUploadResult} />
      ) : (
        <ContractExecution result={dryRunResult as ContractExecutionResult} originalGas={originalGas} useGasEstimates={useGasEstimates}/>
      )}

      {/* Toggle */}
      <div className="mt-4 flex space-x-2">
        <div
          className={`w-12 h-6 flex items-center cursor-pointer rounded-full p-1 duration-300 ease-in-out ${
            useGasEstimates ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          onClick={() => setUseGasEstimates(!useGasEstimates)}
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ease-in-out ${
              useGasEstimates ? 'translate-x-6' : 'translate-x-0'
            }`}
          ></div>
        </div>
        <span>Use Gas Estimates in Call?</span>
      </div>
    </div>
  );
}


// TODO: need to get decimals of chain
//@ts-ignore
function formatBigIntToUnit(value: bigint, decimals: number): string {
  const factor = BigInt(10 ** decimals);
  const formattedValue = value * factor / BigInt(1000000);

  // Convert the formatted value into a string with a fixed number of decimal places
  const integerPart = formattedValue / factor;
  const decimalPart = formattedValue % factor;

  const decimalString = decimalPart.toString().padStart(decimals, '0').slice(0, decimals);
  return `${integerPart}.${decimalString}`;
}

function isOriginalGasSufficient(originalGas: {ref_time: bigint, proof_size: number}, gasRequired: {ref_time: bigint, proof_size: number}): boolean {
  return originalGas?.ref_time >= gasRequired.ref_time && originalGas?.proof_size >= gasRequired.proof_size;
}
