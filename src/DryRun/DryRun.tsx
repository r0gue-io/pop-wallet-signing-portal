// Copyright 2022-2024 use-ink/contracts-ui authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

interface DryRunProps {
  dryRunResult: {
    gas_consumed?: { ref_time: bigint; proof_size: bigint };
    gas_required?: { ref_time: bigint; proof_size: bigint };
    storage_deposit?: { type: string; value: bigint };
    result?: { success: boolean; value?: { account_id?: string; type?: string; value?: { type: string; value?: any } } };
    debug_message?: { asText: () => string };
  };
  useGasEstimates: boolean;
  setUseGasEstimates: (value: boolean) => void;
}

export function DryRun({ dryRunResult, useGasEstimates, setUseGasEstimates }: DryRunProps): JSX.Element {
  return (
    <div className="dry-run-outcome bg-white shadow-md rounded-md p-4">
      <h2 className="text-lg font-bold mb-4">Dry-run Outcome</h2>

      {/* Gas Estimates */}
      {dryRunResult.gas_consumed && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Gas Consumed</h3>
          <div className="flex space-x-4 text-sm">
            <div className="bg-gray-100 p-2 rounded shadow-sm">
              <p>Ref Time</p>
              <p>{dryRunResult.gas_consumed.ref_time.toString()} ns</p>
            </div>
            <div className="bg-gray-100 p-2 rounded shadow-sm">
              <p>Proof Size</p>
              <p>{dryRunResult.gas_consumed.proof_size.toString()} bytes</p>
            </div>
          </div>
        </div>
      )}

      {dryRunResult.gas_required && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Gas Required</h3>
          <div className="flex space-x-4 text-sm">
            <div className="bg-gray-100 p-2 rounded shadow-sm">
              <p>Ref Time</p>
              <p>{dryRunResult.gas_required.ref_time.toString()} ns</p>
            </div>
            <div className="bg-gray-100 p-2 rounded shadow-sm">
              <p>Proof Size</p>
              <p>{dryRunResult.gas_required.proof_size.toString()} bytes</p>
            </div>
          </div>
        </div>
      )}

      {/* Storage Deposit */}
      {dryRunResult.storage_deposit && (
        <div className="mb-4">
          <h3 className="text-md font-semibold">Storage Deposit</h3>
          <div className="bg-gray-100 p-2 rounded shadow-sm text-sm">
            {dryRunResult.storage_deposit.type}: {dryRunResult.storage_deposit.value.toString()} units
          </div>
        </div>
      )}

      {/* Contract Address */}
      <div className="mb-4">
        <h3 className="text-md font-semibold">Contract Address</h3>
        <div className="bg-gray-100 p-2 rounded shadow-sm text-sm">
          {dryRunResult.result?.success && dryRunResult.result.value?.account_id
            ? dryRunResult.result.value.account_id
            : "None"}
        </div>
      </div>

      {/* Result Status */}
      {dryRunResult.result?.success ? (
        <div className="text-green-600 font-bold flex items-center">
          The call will be successful.
        </div>
      ) : (
        <div className="text-red-600 font-bold flex items-center">
          The call will not be successful.
        </div>
      )}

      {/* Detailed Result Info */}
      {dryRunResult.result && dryRunResult.result.value?.type && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Result Details</h3>
          <div className="text-sm bg-gray-100 p-2 rounded">
            <p>Type: {dryRunResult.result.value.type}</p>
            {dryRunResult.result.value.value && (
              <p>Sub-Type: {dryRunResult.result.value.value.type}</p>
            )}
            {dryRunResult.result.value.value?.value !== undefined && (
              <p>Value: {JSON.stringify(dryRunResult.result.value.value.value)}</p>
            )}
          </div>
        </div>
      )}

      {/* Debug Message */}
      {dryRunResult.debug_message && (
        <div className="mt-4">
          <h3 className="text-md font-semibold">Debug Message</h3>
          <p className="text-sm bg-gray-100 p-2 rounded">
            {dryRunResult.debug_message.asText()}
          </p>
        </div>
      )}
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
        <span>Use Gas Estimates?</span>
      </div>
    </div>
  );
}
