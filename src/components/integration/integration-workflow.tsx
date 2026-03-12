"use client"

import { useState } from "react"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Loader2, Zap } from "lucide-react"

export function IntegrationWorkflow({
  open,
  onOpenChange,
  isGmailConnected = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isGmailConnected?: boolean
}) {
  const { token } = useAuth()
  const [connecting, setConnecting] = useState(false)

  const handleConnectGmail = async () => {
    setConnecting(true)
    try {
      if (token) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/integrations/gmail/connect`,
          { headers: { authorization: `Bearer ${token}` } }
        )
        const json = await res.json() as { data?: { url?: string } }
        if (json?.data?.url) {
          window.location.href = json.data.url
        }
      } else {
        setConnecting(false)
      }
    } catch {
      setConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="max-w-lg! rounded-2xl">
        <DialogHeader>
          <DialogTitle>Add Gmail Account</DialogTitle>
        </DialogHeader>

        <div className="min-h-[240px]">
          {isGmailConnected ? (
            <div className="flex flex-col items-center pt-2 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50">
                  <Image
                    src="/favicon.ico"
                    alt="Worldvisa DMS Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <span className="text-muted-foreground">+</span>
                <div className="flex size-12 items-center justify-center rounded-xl border border-green-200 bg-green-50">
                  <Image
                    src="/gmail-icon.svg"
                    alt="Gmail"
                    width={24}
                    height={24}
                    className="size-6"
                  />
                </div>
              </div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <CheckCircle2 className="size-3.5" />
                Gmail Connected
              </div>
              <h3 className="mt-3 text-base font-semibold tracking-tight">
                Ready to automate
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your Gmail is connected. Set up a workflow to start drafting
                personalized messages on a schedule.
              </p>
              <Button
                className="mt-6 gap-2 cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Set Up Workflow
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center pt-2 text-center">
              <div className="mb-4 flex items-center justify-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-muted/50">
                  <Image
                    src="/favicon.ico"
                    alt="Worldvisa DMS Logo"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <span className="text-muted-foreground">+</span>
                <div className="flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                  <Image
                    src="/gmail-icon.svg"
                    alt="Gmail"
                    width={24}
                    height={24}
                    className="size-6 opacity-90"
                  />
                </div>
              </div>
              <h3 className="text-base font-semibold tracking-tight">
                Connect to Gmail
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Connect your Gmail account so Agentra can draft and send
                messages from your inbox. Emails go out from your real address—
                recipients never see that it's AI-assisted.
              </p>
              <Button
                className="mt-6 gap-2 cursor-pointer bg-primary-blue"
                disabled={connecting}
                premium3D
                onClick={handleConnectGmail}
              >
                {connecting && <Loader2 className="size-4 animate-spin" />}
                {connecting ? "Connecting…" : "Connect Account"}
                {!connecting && (
                  <ArrowRight className="size-4 fill-primary-foreground text-primary-foreground" />
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
