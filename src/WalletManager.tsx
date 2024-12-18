import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useWalletDisconnector } from '@reactive-dot/react'
import { ConnectionDialog } from 'dot-connect/react.js'
import { Polkicon } from '@polkadot-ui/react'
import {ChevronDown} from "@/components/ui/chevron-down.tsx"

import { useAccounts } from './context/AccountsContext'
import { Fragment, useEffect, useState } from 'react'
export const WalletManager = () => {
  const { accounts, selectAccount, selectedAccount } = useAccounts()
  const [, disconnectAll] = useWalletDisconnector()
  const [isConnectionDialogOpen, setIsConnectionDialogOpen] = useState(false)

  useEffect(() => {
    if (!selectedAccount?.address && accounts.length > 0) {
      selectAccount(accounts[0])
      setIsConnectionDialogOpen(false)
    }
  }, [accounts, selectAccount, selectedAccount?.address])

  return (
    <>
        <div className="flex w-full justify-center">
          <div className="flex w-full">
            {!accounts.length && (
              <Button onClick={() => setIsConnectionDialogOpen(true)}
              className="w-full text-lg font-bold bg-pink-700 hover:bg-blue-600"
              >
                Connect Wallet
              </Button>
            )}
            {!!accounts.length && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="default"
                    className="cursor-pointer overflow-hidden w-full flex items-center justify-center gap-2"
                  >
                    <Polkicon
                      size={36}
                      address={selectedAccount?.address || ''}
                      className="mr-2"
                      outerColor="transparent"
                    />
                    {selectedAccount?.name}
                    <ChevronDown className="ml-2 h-4 w-4" isOpen={false}/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="max-h-[calc(100vh-5rem)] overflow-auto">
                  {accounts.map((account, index) => (
                    <Fragment key={account.address}>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        key={account.address}
                        onClick={() => selectAccount(account)}
                      >
                        <Polkicon
                          size={28}
                          address={account.address || ''}
                          className="mr-2"
                          outerColor="transparent"
                        />
                        {account.name}
                      </DropdownMenuItem>
                      {index !== accounts.length - 1 && (
                        <DropdownMenuSeparator />
                      )}
                    </Fragment>
                  ))}
                  <DropdownMenuItem
                    className="cursor-pointer"
                    key={'show'}
                    onClick={() => {
                      setIsConnectionDialogOpen(true)
                    }}
                  >
                    Show wallets
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    key={'logout'}
                    onClick={() => {
                      disconnectAll()
                      selectAccount(undefined)
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      <ConnectionDialog
        open={isConnectionDialogOpen}
        onClose={() => setIsConnectionDialogOpen(false)}
      />
    </>
  )
}
