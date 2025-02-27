import React, { useState } from "react";
import { ChainProperties, formatCurrency} from "@/lib/utils.ts"
import { ChevronDown } from "@/components/ui/chevron-down.tsx";
import { CostItem } from "./CostItem";
import { ErrorIcon, SuccessIcon } from "@/DryRun/DryRun";

interface CostSummaryProps {
  fees: bigint;
  deposit: bigint;
  accountBalance: bigint;
  proxyAccountBalance?: bigint;
  chainProperties: ChainProperties;  
}

export const CostSummary: React.FC<CostSummaryProps> = ({ fees, deposit, accountBalance, proxyAccountBalance, chainProperties }) => {
  const [isOpen, setIsOpen] = useState(true);

  const totalCost = fees + deposit;
  const isProxyUsed = proxyAccountBalance !== undefined;

  const isInsufficientFunds = !isProxyUsed && accountBalance < totalCost;
  const isProxyInsufficientFunds = isProxyUsed && proxyAccountBalance < totalCost;

  return (
    <div className="mt-6 bg-gray-100 border border-gray-300 rounded-lg p-4">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center space-x-2">
          <button className="w-6 h-6 flex justify-center items-center p-1 bg-gray-200 rounded-full" onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown isOpen={isOpen} className="" />
          </button>
          <h3 className="text-lg font-semibold">Cost Summary</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isInsufficientFunds || isProxyInsufficientFunds ? (
            <div className="flex items-center space-x-2">
              <span className="text-red-600 font-medium">fails</span>
              <ErrorIcon size={8} />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-medium">succeeds</span>
              <SuccessIcon />
            </div>
          )}
        </div>
      </div>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="mt-3 space-y-2">
          <CostItem title="Fees" amount={fees} chainProperties={chainProperties} />
          <CostItem title="Storage Deposit" amount={deposit} chainProperties={chainProperties} />
          <CostItem title="Total Cost" amount={totalCost} chainProperties={chainProperties} isBold />
          <CostItem title="Your Balance" amount={accountBalance} chainProperties={chainProperties} />

          {isProxyUsed && (
            <React.Fragment>
              <CostItem title="Proxy Balance" amount={proxyAccountBalance!} chainProperties={chainProperties} />
              {isProxyInsufficientFunds ? (
                <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded mt-3">
                  <p className="font-semibold">Insufficient Proxy Balance</p>
                  <p>The proxy account does not have enough balance.</p>
                  <p>You need at least <span className="font-bold">{formatCurrency(totalCost, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}</span> in the proxy account.</p>
                </div>
              ) : null}
            </React.Fragment>
          )}

          {/* Only show this if the main account has insufficient funds AND there's no proxy */}
          {!isProxyUsed && isInsufficientFunds ? (
            <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded mt-3">
              <p className="font-semibold">Insufficient Funds</p>
              <p>You need at least <span className="font-bold">{formatCurrency(totalCost, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}</span> to complete this transaction.</p>
              <div className="text-red-600 font-bold flex items-center mt-2">
                The call will not be successful.
              </div>
            </div>
          ) : null}

          {/* Show success message ONLY if neither the main nor the proxy account is insufficient */}
          {!isInsufficientFunds && !isProxyInsufficientFunds ? (
            <div className="text-green-600 font-bold flex items-center mt-3">
              The call will be successful.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};