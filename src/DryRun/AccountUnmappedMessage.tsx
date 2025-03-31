import React from "react";

interface AccountUnmappedMessageProps {
  rpc: string;
}

const AccountUnmappedMessage: React.FC<AccountUnmappedMessageProps> = ({ rpc }) => {
    return (
      <div>
        <span>Account not mapped.</span>
        <span className="mt-1">You can map it by running the following command:</span>
        <pre className="bg-red-50 text-red-800 text-sm p-3 mt-2 rounded-md border border-red-200 whitespace-pre-wrap break-words">
          pop call chain --pallet Revive --function map_account --url {rpc} --use-wallet
        </pre>
      </div>
    );
  };
  
  export default AccountUnmappedMessage;
  