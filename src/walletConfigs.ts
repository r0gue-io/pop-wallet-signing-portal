import type { Config } from '@reactive-dot/core'
import { registerDotConnect } from 'dot-connect'
import {
  InjectedWalletProvider,
} from "@reactive-dot/core/wallets.js";
export const config = {
  chains: {},
  wallets: [new InjectedWalletProvider()],
} satisfies Config

// Register dot-connect custom elements & configure supported wallets
registerDotConnect({
  wallets: config.wallets,
})
