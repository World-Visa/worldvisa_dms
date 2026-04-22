"use client"

import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { RiArrowDownSLine, RiSearchLine } from "react-icons/ri"

import { cn } from "@/lib/utils"
import { Button } from "../ui/primitives/button"
import TruncatedText from "@/components/ui/truncated-text"

type Conversation = {
  id: string
  title: string
  createdAt: string
}

const SAMPLE_CONVERSATIONS: Conversation[] = [
  { id: "new", title: "New conversation", createdAt: "today" },
  { id: "wk-1", title: "i have a files storaged in my zoho workdriv...", createdAt: "4d" },
  { id: "old-1", title: "i delete most records still why my bucket ...", createdAt: "39d" },
  { id: "old-2", title: "how to delete all the file in the bucket", createdAt: "39d" },
]

function groupConversations(conversations: Conversation[]) {
  const pastWeek: Conversation[] = []
  const older: Conversation[] = []

  for (const c of conversations) {
    if (c.id === "new") continue
    const isPastWeek = c.createdAt.endsWith("d") && Number(c.createdAt.replace("d", "")) <= 7
    if (isPastWeek) pastWeek.push(c)
    else older.push(c)
  }

  return { pastWeek, older }
}

function ConversationRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: Conversation
  selected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-normal",
        "transition-colors",
        selected
          ? "bg-bg-strong text-text-white"
          : "hover:bg-bg-weak text-text-sub"
      )}
    >
      <span className="min-w-0 flex-1 text-left truncate">
          {conversation.title}
      </span>
      <span
        className={cn(
          "shrink-0 text-xs",
          selected ? "text-text-soft" : "text-text-sub"
        )}
      >
        {conversation.createdAt}
      </span>
    </button>
  )
}

export function ConverstionDropdown({
  className,
}: {
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string>("new")

  const selected = useMemo(
    () => SAMPLE_CONVERSATIONS.find((c) => c.id === selectedId) ?? SAMPLE_CONVERSATIONS[0],
    [selectedId]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SAMPLE_CONVERSATIONS
    return SAMPLE_CONVERSATIONS.filter((c) => c.title.toLowerCase().includes(q))
  }, [query])

  const grouped = useMemo(() => groupConversations(filtered), [filtered])

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        variant="secondary"
        size="xs"
        mode="lighter"
        className="text-xs font-normal w-full"
        aria-haspopup="dialog"
        aria-expanded={open}
        trailingIcon={RiArrowDownSLine}
      >
        {selected.title}
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close conversation menu"
              className="fixed inset-0 z-40 cursor-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className={cn(
                "absolute left-0 top-11 z-50 w-[300px] overflow-hidden rounded-xl",
                "bg-white shadow-[0_18px_60px_rgba(10,13,20,0.16)] ring-1 ring-stroke-soft"
              )}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
            >
              <div className="p-3">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2",
                    "ring-1 ring-inset ring-neutral-200 bg-neutral-50/60"
                  )}
                >
                  <RiSearchLine className="size-4 text-neutral-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className={cn(
                      "h-6 w-full bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400",
                      "outline-none"
                    )}
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-[340px] overflow-y-auto px-2 pb-2">
                {grouped.pastWeek.length > 0 && (
                  <div className="px-2 pb-1 pt-2">
                    <div className="text-[12px] font-semibold text-neutral-400">
                      Past week
                    </div>
                  </div>
                )}
                {grouped.pastWeek.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    selected={selectedId === c.id}
                    onSelect={(id) => {
                      setSelectedId(id)
                      setOpen(false)
                    }}
                  />
                ))}

                {grouped.older.length > 0 && (
                  <div className="px-2 pb-1 pt-3">
                    <div className="text-[12px] font-semibold text-neutral-400">
                      Older
                    </div>
                  </div>
                )}
                {grouped.older.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    selected={selectedId === c.id}
                    onSelect={(id) => {
                      setSelectedId(id)
                      setOpen(false)
                    }}
                  />
                ))}
              </div>

              <div className="border-t border-neutral-100 p-2">
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedId("new")
                    setQuery("")
                    setOpen(false)
                  }}
                  variant="secondary"
                  size="sm"
                  mode="outline"
                  className="text-sm font-normal w-full"
                >
                  New conversation
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}