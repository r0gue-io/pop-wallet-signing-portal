import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExtensionProvider } from "./context/ExtensionProvider"
import { AccountProvider } from "./context/AccountProvider"
import {SigningPortal} from "./SigningPortal"

export default function LoginForm() {
  return (
    <div className="flex items-center justify-center mt-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
           Pop Signing Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ExtensionProvider>
            <AccountProvider>
              <div className="overflow-auto break-words whitespace-pre-wrap">
                <SigningPortal />
              </div>
            </AccountProvider>
          </ExtensionProvider>
        </CardContent>
      </Card>
    </div>
  )
}
