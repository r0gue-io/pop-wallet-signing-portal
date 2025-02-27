import React from "react";
import { ChainProperties, formatCurrency} from "@/lib/utils.ts"

interface CostItemProps {
  title: string;
  amount: bigint;
  chainProperties: ChainProperties;
  isBold?: boolean;
}

export const CostItem: React.FC<CostItemProps> = ({ title, amount, chainProperties, isBold = false }) => {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-gray-600 ${isBold ? "font-bold" : "font-semibold"}`}>{title}:</span>
      <span className={`text-gray-900 ${isBold ? "font-bold" : "font-light"}`}>
        {formatCurrency(amount, chainProperties.tokenDecimals)} {chainProperties.tokenSymbol}
      </span>
    </div>
  );
};