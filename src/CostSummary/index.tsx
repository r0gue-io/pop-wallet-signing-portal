import { useState } from "react";
import { ChevronDown } from "@/components/ui/chevron-down.tsx";

interface CostSummaryProps {
  fees: number;
  deposit: number;
  accountBalance: number;
}

export const CostSummary: React.FC<CostSummaryProps> = ({ fees, deposit, accountBalance }) => {
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
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold">Fees:</span>
            <span className="text-gray-900 font-light">{fees}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold">Storage Deposit:</span>
            <span className="text-gray-900 font-light">{deposit}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-bold">Total Cost:</span>
            <span className="text-gray-900 font-bold">{totalCost}</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-md font-semibold">Your Balance:</h4>
              <div className={`px-3 py-1 rounded font-bold ${isInsufficientFunds ? "bg-red-100 text-red-700 border border-red-400" : "bg-green-100 text-green-700 border border-green-400"}`}>
                {accountBalance}
              </div>
            </div>

            {isInsufficientFunds && (
              <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                <p className="font-semibold">Insufficient Funds</p>
                <p>You need at least <span className="font-bold">{totalCost} UNIT</span> to complete this transaction.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};