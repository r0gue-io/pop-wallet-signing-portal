import { useState } from "react";
import { ChainProperties, formatCurrency} from "@/lib/utils.ts"
import { ChevronDown } from "@/components/ui/chevron-down.tsx";
import { CostItem } from "./CostItem";

interface CostSummaryProps {
  fees: bigint;
  deposit: bigint;
  accountBalance: bigint;
  chainProperties: ChainProperties;
}

export const CostSummary: React.FC<CostSummaryProps> = ({ fees, deposit, accountBalance, chainProperties }) => {
  const [isOpen, setIsOpen] = useState(true);

  const totalCost = fees + deposit;
  const isInsufficientFunds = accountBalance < totalCost;

  return (
    <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-lg font-bold">Cost Summary</h3>
        <ChevronDown isOpen={isOpen} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <div className="mt-3 space-y-2">
            <CostItem title="Fees" amount={fees} chainProperties={chainProperties} />
            <CostItem title="Storage Deposit" amount={deposit} chainProperties={chainProperties} />
            <CostItem title="Total Cost" amount={totalCost} chainProperties={chainProperties} isBold />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold">Your Balance:</h4>
              <div className={`px-3 py-1 rounded font-bold ${isInsufficientFunds ? "bg-red-100 text-red-700 border border-red-400" : "bg-green-100 text-green-700 border border-green-400"}`}>
                {formatCurrency(accountBalance, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}
              </div>
            </div>

            {isInsufficientFunds && (
              <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-semibold">Insufficient Funds</p>
                <p>You need at least <span className="font-bold">{formatCurrency(totalCost, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}</span> to complete this transaction.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};