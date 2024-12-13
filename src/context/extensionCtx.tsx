import {
  InjectedExtension,
  getInjectedExtensions,
} from "polkadot-api/pjs-signer"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

const getJoinedInjectedExtensions = () => getInjectedExtensions().join(",")

export const useAvailableExtensions = (): string[] => {
  const [extensions, setExtensions] = useState(getJoinedInjectedExtensions)

  useEffect(() => {
    let token: any
    const updateExtensions = () => {
      const jointedExtensions = getJoinedInjectedExtensions()
      setExtensions(jointedExtensions)
      token = setTimeout(updateExtensions, jointedExtensions ? 2_000 : 100)
    }
    updateExtensions()

    return () => {
      clearTimeout(token)
    }
  }, [])

  return useMemo(
    () => (extensions.length ? extensions.split(",") : []),
    [extensions],
  )
}

export const extensionCtx = createContext<InjectedExtension[]>([])
export const useSelectedExtensions = () => useContext(extensionCtx)
