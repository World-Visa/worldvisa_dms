/* ─────────────────────────────────────────────────────────
 * EVENT DETAILS CARD — ANIMATION STORYBOARD
 *
 * Mount sequence:
 *    0ms  wrapper fade + scale 0.96→1
 *   80ms  heading y –6→0
 *  160ms  card y 10→0
 *  260ms  rows 1–4 (100ms stagger, y 6→0)
 *  660ms  description body opacity fade
 *
 * Hover (value chip):
 *  bg:      opacity 0→1 — 150ms ease-out
 *  pencil:  width 0→30, scale 0.25→1, blur 4→0 — spring 300ms
 *
 * Edit (click pencil):
 *  chip pulse: scale 1→1.02→1 — spring bounce
 *  pencil:  collapses out (width 30→0)
 *  check:   width 0→30, scale 0.25→1, blur 4→0 — spring 300ms
 *  close:   same, 40ms stagger
 *  input:   auto-focuses, auto-sizes via ghost span
 *  Enter / click ✓  → confirm  |  Escape / click × → cancel
 * ───────────────────────────────────────────────────────── */

import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'framer-motion'
import { Icon } from '@iconify/react'
import { toast } from 'sonner'
import type { TaskFormData, TaskStatus, TimeParts } from '@/types/tasks'
import { TASK_STATUS_OPTIONS } from '@/lib/constants/tasks'
import { TaskStatusBadge } from './TaskStatusBadge'
import { CalendarPopover } from './CalendarPopover'
import { TimePickerPopover } from './TimePickerPopover'

// ─── Date helpers ──────────────────────────────────────────
function parseDateStr(str: string): Date {
  const d = new Date(str)
  return isNaN(d.getTime()) ? new Date() : d
}
function formatDateStr(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(date)
}

function dateToTimeParts(date: Date): TimeParts {
  const hours24 = date.getHours()
  const p: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM'
  let h = hours24 % 12
  if (h === 0) h = 12
  return {
    h: String(h),
    m: String(date.getMinutes()).padStart(2, '0'),
    p,
  }
}

function getDefaultTimeRange(): { start: TimeParts; end: TimeParts } {
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  return {
    start: dateToTimeParts(now),
    end: dateToTimeParts(oneHourLater),
  }
}

// ─── Timing (seconds) ─────────────────────────────────────
const T = {
  wrapper:   0,
  heading:   0.08,
  card:      0.16,
  row1:      0.26,
  row2:      0.36,
  row3:      0.46,
  row4:      0.52,
  row5:      0.58,
  descLabel: 0.64,
  descBody:  0.74,
  saveBtn:   0.84,
} as const

// ─── Transitions ──────────────────────────────────────────
const mountSpring = { type: 'spring', duration: 0.45, bounce: 0 }  as const
const softFade    = { duration: 0.3,  ease: [0.2, 0, 0, 1] }       as const
const bgFade      = { duration: 0.15, ease: [0.2, 0, 0, 1] }       as const
const iconPop     = { type: 'spring', duration: 0.3, bounce: 0 }   as const
const iconPopLate = { type: 'spring', duration: 0.3, bounce: 0, delay: 0.04 } as const
const SPRING_PRESS = { type: 'spring' as const, stiffness: 500, damping: 28 }
const SPRING_CHECK = { type: 'spring' as const, visualDuration: 0.28, bounce: 0.3 }

const SAVE_BUTTON_SURFACE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%),' +
    'linear-gradient(90deg, #171717 0%, #171717 100%)',
  boxShadow:
    '0px 0px 0px 0.75px #171717,' +
    'inset 0px 1px 2px 0px rgba(255,255,255,0.16)',
}

// ─── Card shadow (Figma exact) ─────────────────────────────
const CARD_SHADOW = [
  '0px 0px 0px 1px rgba(51,51,51,0.04)',
  '0px 16px 8px -8px rgba(51,51,51,0.01)',
  '0px 12px 6px -6px rgba(51,51,51,0.02)',
  '0px 5px 5px -2.5px rgba(51,51,51,0.08)',
  '0px 1px 3px -1.5px rgba(51,51,51,0.16)',
  'inset 0px -0.5px 0.5px 0px rgba(51,51,51,0.08)',
].join(', ')

// ─── Text classes ──────────────────────────────────────────
const labelCls = 'text-[14px] font-normal  leading-5 tracking-[-0.084px] text-[#5c5c5c] whitespace-nowrap'
const valueCls = 'text-[14px] font-medium  leading-5 tracking-[-0.084px] text-[#5c5c5c] whitespace-nowrap'

// ─── Collapsible icon slot (width 0→30) ───────────────────
interface IconSlotProps {
  visible: boolean
  transition?: object
  children: React.ReactNode
}
function IconSlot({ visible, transition = iconPop, children }: IconSlotProps) {
  return (
    <motion.span
      className="relative z-10 flex items-center overflow-hidden shrink-0"
      animate={{ width: visible ? 30 : 0 }}
      transition={transition}
    >
      <motion.span
        className="flex items-center pl-[10px] shrink-0"
        animate={{
          opacity: visible ? 1 : 0,
          scale:   visible ? 1 : 0.25,
          filter:  visible ? 'blur(0px)' : 'blur(4px)',
        }}
        transition={transition}
      >
        {children}
      </motion.span>
    </motion.span>
  )
}

// ─── Row ──────────────────────────────────────────────────
interface RowProps {
  icon: string
  label: string
  value: string
  delay: number
  chipRounded?: string
  ariaLabel?: string
  pickerType?: 'calendar'
  placeholder?: string
  autoFocusOnMount?: boolean
  onValueChange?: (value: string) => void
}

function Row({ icon, label, value: initialValue, delay, chipRounded = 'rounded-[8px]', ariaLabel, pickerType, placeholder, autoFocusOnMount, onValueChange }: RowProps) {
  const [hovered,    setHovered]    = useState(false)
  const [isEditing,  setIsEditing]  = useState(Boolean(autoFocusOnMount && !initialValue))
  const [editValue,  setEditValue]  = useState(initialValue)
  const [savedValue, setSavedValue] = useState(initialValue)
  const [inputWidth, setInputWidth] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const rowRef   = useRef<HTMLDivElement>(null)
  const wasEditingRef = useRef(false)
  const chipControls = useAnimationControls()

  // Keep ghost span in sync → measure width before paint
  useLayoutEffect(() => {
    if (ghostRef.current) setInputWidth(ghostRef.current.offsetWidth)
  }, [editValue])

  useEffect(() => {
    onValueChange?.(editValue)
  }, [editValue, onValueChange])

  // Focus only when entering edit mode — never re-run while typing
  useEffect(() => {
    const justEnteredEdit = isEditing && !wasEditingRef.current
    wasEditingRef.current = isEditing

    if (!justEnteredEdit || pickerType === 'calendar') return

    const focusDelay = autoFocusOnMount ? Math.round(delay * 1000) + 80 : 40
    const id = setTimeout(() => {
      const input = inputRef.current
      if (!input) return
      input.focus()
      if (input.value) input.select()
    }, focusDelay)
    return () => clearTimeout(id)
  }, [isEditing, pickerType, autoFocusOnMount, delay])

  // Close calendar on outside click or Escape
  useEffect(() => {
    if (!isEditing || pickerType !== 'calendar') return
    const onDown = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) cancelEdit()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelEdit()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown',   onKey)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, pickerType])

  const enterEdit = () => {
    setSavedValue(editValue)
    setIsEditing(true)
    setHovered(false)
    chipControls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 0.4, times: [0, 0.35, 1], ease: [0.34, 1.56, 0.64, 1] },
    })
  }

  const confirmEdit = () => {
    setSavedValue(editValue)
    setIsEditing(false)
  }

  const cancelEdit = () => {
    setEditValue(savedValue)
    setIsEditing(false)
  }

  const isCalendar = pickerType === 'calendar'

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay }}
      className="relative flex items-center justify-between"
    >
      {/* Calendar popover — floats above this row when editing */}
      {isCalendar && (
        <AnimatePresence>
          {isEditing && (
            <motion.div
              className="absolute bottom-full right-0 z-50 w-[220px] pb-1"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1,    y: 0 }}
              exit={{    opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
              style={{ transformOrigin: 'bottom center' }}
            >
              <CalendarPopover
                initialDate={parseDateStr(editValue)}
                onApply={date => {
                  const s = formatDateStr(date)
                  setEditValue(s)
                  setSavedValue(s)
                  setIsEditing(false)
                }}
                onCancel={cancelEdit}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Left: row icon + label */}
      <div className="flex items-center gap-2">
        <Icon icon={icon} width={20} height={20} className="text-[#A4A4A4] shrink-0" />
        <span className={labelCls}>{label}</span>
      </div>

      {/* Right: value chip */}
      <motion.div
        animate={chipControls}
        className={`relative flex items-center px-3 py-2 ${chipRounded} cursor-default select-none`}
        onMouseEnter={() => !isEditing && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Chip background — visible on hover OR while editing */}
        <motion.div
          className={`absolute inset-0 ${chipRounded} bg-[#f7f7f7] pointer-events-none`}
          animate={{ opacity: hovered || isEditing ? 1 : 0 }}
          transition={bgFade}
        />

        {/* Ghost span — mirrors input text for width measurement */}
        <span
          ref={ghostRef}
          aria-hidden
          className={`absolute invisible pointer-events-none ${valueCls}`}
        >
          {editValue || 'x'}
        </span>

        {/* Value: input in text-edit mode, static span otherwise */}
        {isEditing && !isCalendar ? (
          <input
            ref={inputRef}
            value={editValue}
            placeholder={placeholder}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  confirmEdit()
              if (e.key === 'Escape') cancelEdit()
            }}
            className={`relative z-10 bg-transparent border-none outline-none p-0 placeholder:font-normal placeholder:text-[#A4A4A4] ${valueCls}`}
            style={{ width: inputWidth || 'auto' }}
            aria-label={ariaLabel ?? `Edit ${label}`}
          />
        ) : (
          <span
            className={`relative z-10 ${valueCls} ${!editValue && placeholder ? 'font-normal text-[#A4A4A4]' : ''}`}
          >
            {editValue || placeholder}
          </span>
        )}

        {/* Pencil — visible on hover only */}
        <IconSlot visible={hovered && !isEditing} transition={iconPop}>
          <button
            type="button"
            aria-label={`Edit ${label}`}
            className="flex items-center focus-visible:outline-none"
            onClick={enterEdit}
            tabIndex={hovered ? 0 : -1}
          >
            <Icon icon="mingcute:pencil-line" width={20} height={20} className="text-[#A4A4A4]" />
          </button>
        </IconSlot>

        {/* Check + Close — only for text-edit mode (calendar has its own buttons) */}
        {!isCalendar && (
          <>
            <IconSlot visible={isEditing} transition={iconPop}>
              <button
                type="button"
                aria-label="Confirm"
                className="flex items-center focus-visible:outline-none active:scale-[0.96] transition-transform duration-75"
                onClick={confirmEdit}
                tabIndex={isEditing ? 0 : -1}
              >
                <Icon icon="mingcute:check-line" width={20} height={20} className="text-[#A4A4A4] hover:text-[#5c5c5c] transition-colors duration-150" />
              </button>
            </IconSlot>

            <IconSlot visible={isEditing} transition={isEditing ? iconPopLate : iconPop}>
              <button
                type="button"
                aria-label="Cancel"
                className="flex items-center focus-visible:outline-none active:scale-[0.96] transition-transform duration-75"
                onClick={cancelEdit}
                tabIndex={isEditing ? 0 : -1}
              >
                <Icon icon="mingcute:close-line" width={20} height={20} className="text-[#A4A4A4] hover:text-[#5c5c5c] transition-colors duration-150" />
              </button>
            </IconSlot>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Direct input row (always editable, no pencil) ────────
interface DirectInputRowProps {
  icon: string
  label: string
  delay: number
  placeholder?: string
  ariaLabel?: string
  inputType?: React.HTMLInputTypeAttribute
  onValueChange?: (value: string) => void
  initialValue?: string
}

function DirectInputRow({
  icon,
  label,
  delay,
  placeholder,
  ariaLabel,
  inputType = 'text',
  onValueChange,
  initialValue = '',
}: DirectInputRowProps) {
  const [value, setValue] = useState(initialValue)
  const [focused, setFocused] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay }}
      className="flex items-center justify-between gap-2"
    >
      <div className="flex items-center gap-2 shrink-0">
        <Icon icon={icon} width={20} height={20} className="text-[#A4A4A4] shrink-0" />
        <span className={labelCls}>{label}</span>
      </div>

      <div className="relative flex-1 min-w-0 max-w-[240px] ml-2">
        <motion.div
          className="absolute inset-0 rounded-[8px] bg-[#f7f7f7] pointer-events-none"
          animate={{ opacity: focused || value ? 1 : 0.7 }}
          transition={bgFade}
        />
        <input
          type={inputType}
          value={value}
          onChange={e => {
            setValue(e.target.value)
            onValueChange?.(e.target.value)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="relative z-10 w-full min-w-0 rounded-[8px] border-none bg-transparent px-3 py-2 text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#5c5c5c] outline-none placeholder:font-normal placeholder:text-[#A4A4A4] focus-visible:ring-1 focus-visible:ring-[#d4d4d4]"
          aria-label={ariaLabel ?? label}
        />
      </div>
    </motion.div>
  )
}

// ─── Time row ─────────────────────────────────────────────
/* Storyboard — SPLIT animation (right side only, label stays):
 *
 * Both chips start at the same center x, then spring apart (cell-division):
 *   0ms   single chip: opacity 1→0  (80ms)
 *   0ms   start chip:  x +54→0, scale 0.9→1, opacity 0→1  spring 420ms bounce 0.26
 *  50ms   end chip:    x -54→0, scale 0.9→1               spring 420ms bounce 0.26
 * 100ms   check chip:  scale 0.72→1, opacity 0→1           spring 350ms bounce 0.32
 * Exit:   chips snap back to center (spring 220ms), single chip fades in
 *
 * Time picker popover:
 *   Opens above chip on click — scale 0.95→1, y 8→0, opacity 0→1 — spring 350ms
 *   Escape closes picker first, then cancels edit
 */
function TimeRow({
  delay,
  initialStart,
  initialEnd,
  onRangeChange,
}: {
  delay: number
  initialStart?: TimeParts
  initialEnd?: TimeParts
  onRangeChange?: (start: TimeParts, end: TimeParts) => void
}) {
  const defaultRange = getDefaultTimeRange()

  const [hovered,    setHovered]    = useState(false)
  const [isEditing,  setIsEditing]  = useState(false)
  const [start,      setStart]      = useState(initialStart ?? defaultRange.start)
  const [end,        setEnd]        = useState(initialEnd ?? defaultRange.end)
  const [openPicker, _setOpenPicker] = useState<'start' | 'end' | null>(null)

  const savedStart    = useRef({ ...(initialStart ?? defaultRange.start) })
  const savedEnd      = useRef({ ...(initialEnd ?? defaultRange.end) })
  const openPickerRef = useRef<'start' | 'end' | null>(null)
  const rowRef        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    onRangeChange?.(start, end)
  }, [start, end, onRangeChange])

  const setOpenPicker = (v: 'start' | 'end' | null) => {
    openPickerRef.current = v
    _setOpenPicker(v)
  }

  const displayValue = `${start.h}:${start.m} ${start.p} – ${end.h}:${end.m} ${end.p}`

  const enterEdit = () => {
    savedStart.current = { ...start }
    savedEnd.current   = { ...end }
    setOpenPicker(null)
    setIsEditing(true)
    setHovered(false)
  }

  const confirmEdit = () => {
    setOpenPicker(null)
    setIsEditing(false)
  }

  useEffect(() => {
    if (!isEditing) return
    const cancel = () => {
      setStart({ ...savedStart.current })
      setEnd({   ...savedEnd.current })
      openPickerRef.current = null
      _setOpenPicker(null)
      setIsEditing(false)
    }
    const onDown = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) cancel()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openPickerRef.current !== null) setOpenPicker(null)
        else cancel()
      }
      if (e.key === 'Enter' && openPickerRef.current === null) confirmEdit()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown',   onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown',   onKey)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing])

  const splitSpring     = { type: 'spring', duration: 0.42, bounce: 0.26 } as const
  const splitSpringLate = { type: 'spring', duration: 0.42, bounce: 0.26, delay: 0.05 } as const
  const checkSpring     = { type: 'spring', duration: 0.35, bounce: 0.32, delay: 0.10 } as const
  const collapseSpring  = { type: 'spring', duration: 0.22, bounce: 0    } as const
  const pickerSpring    = { type: 'spring', duration: 0.35, bounce: 0.12 } as const

  const chipCls = (active: boolean) => [
    'w-[96px] shrink-0 flex items-center justify-between rounded-[12px] px-3 py-2',
    'cursor-pointer select-none transition-colors duration-100',
    active ? 'bg-[#efefef]' : 'bg-[#f7f7f7]',
  ].join(' ')

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay }}
      className="flex items-center justify-between"
    >
      {/* Left: label — always visible */}
      <div className="flex items-center gap-2 shrink-0">
        <Icon icon="mingcute:time-line" width={20} height={20} className="text-[#A4A4A4] shrink-0" />
        <span className={labelCls}>Time</span>
      </div>

      {/* Right: single ↔ split */}
      <div className="flex-1 flex justify-end min-w-0 ml-2">
        <AnimatePresence mode="wait" initial={false}>

          {/* Display chip */}
          {!isEditing && (
            <motion.div
              key="single"
              className="relative flex items-center px-3 py-2 rounded-[12px] cursor-default select-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.08 } }}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
            >
              <motion.div
                className="absolute inset-0 rounded-[12px] bg-[#f7f7f7] pointer-events-none"
                animate={{ opacity: hovered ? 1 : 0 }}
                transition={bgFade}
              />
              <span className={`relative z-10 ${valueCls}`}>{displayValue}</span>
              <IconSlot visible={hovered} transition={iconPop}>
                <button
                  type="button"
                  aria-label="Edit Time"
                  className="flex items-center focus-visible:outline-none"
                  onClick={enterEdit}
                  tabIndex={hovered ? 0 : -1}
                >
                  <Icon icon="mingcute:pencil-line" width={20} height={20} className="text-[#A4A4A4]" />
                </button>
              </IconSlot>
            </motion.div>
          )}

          {/* Split chips */}
          {isEditing && (
            <motion.div
              key="split"
              className="flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >

              {/* Start chip */}
              <div className="relative">
                <motion.div
                  className={chipCls(openPicker === 'start')}
                  onClick={() => setOpenPicker(openPicker === 'start' ? null : 'start')}
                  initial={{ opacity: 0, x: 54,  scale: 0.9 }}
                  animate={{ opacity: 1, x: 0,   scale: 1   }}
                  exit={{    opacity: 0, x: 54,  scale: 0.9, transition: collapseSpring }}
                  transition={splitSpring}
                  whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
                >
                  <span className={`${valueCls} text-[#171717] tabular-nums`}>{start.h}:{start.m}</span>
                  <span className="text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#A3A3A3]">{start.p}</span>
                </motion.div>
                <AnimatePresence>
                  {openPicker === 'start' && (
                    <motion.div
                      className="absolute bottom-full right-0 z-50 w-[192px] pb-1"
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1,    y: 0 }}
                      exit={{    opacity: 0, scale: 0.95, y: 8 }}
                      transition={pickerSpring}
                      style={{ transformOrigin: 'bottom center' }}
                    >
                      <TimePickerPopover
                        initialH={start.h} initialM={start.m} initialP={start.p}
                        onApply={(h, m, p) => { setStart({ h, m, p }); setOpenPicker(null) }}
                        onCancel={() => setOpenPicker(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* End chip */}
              <div className="relative">
                <motion.div
                  className={chipCls(openPicker === 'end')}
                  onClick={() => setOpenPicker(openPicker === 'end' ? null : 'end')}
                  initial={{ opacity: 0, x: -54, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0,   scale: 1   }}
                  exit={{    opacity: 0, x: -54, scale: 0.9, transition: collapseSpring }}
                  transition={splitSpringLate}
                  whileTap={{ scale: 0.96, transition: { duration: 0.08 } }}
                >
                  <span className={`${valueCls} text-[#171717] tabular-nums`}>{end.h}:{end.m}</span>
                  <span className="text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#A3A3A3]">{end.p}</span>
                </motion.div>
                <AnimatePresence>
                  {openPicker === 'end' && (
                    <motion.div
                      className="absolute bottom-full right-0 z-50 w-[192px] pb-1"
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1,    y: 0 }}
                      exit={{    opacity: 0, scale: 0.95, y: 8 }}
                      transition={pickerSpring}
                      style={{ transformOrigin: 'bottom center' }}
                    >
                      <TimePickerPopover
                        initialH={end.h} initialM={end.m} initialP={end.p}
                        onApply={(h, m, p) => { setEnd({ h, m, p }); setOpenPicker(null) }}
                        onCancel={() => setOpenPicker(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm chip */}
              <motion.button
                type="button"
                onClick={confirmEdit}
                aria-label="Confirm time"
                className="shrink-0 flex items-center bg-[#f7f7f7] rounded-[12px] px-3 py-2 focus-visible:outline-none"
                initial={{ opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{    opacity: 0, scale: 0.8, transition: { duration: 0.08 } }}
                transition={checkSpring}
                whileTap={{ scale: 0.88, transition: { duration: 0.08 } }}
              >
                <Icon icon="mingcute:check-line" width={20} height={20} className="text-[#A4A4A4] hover:text-[#5c5c5c] transition-colors duration-150" />
              </motion.button>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Status row (edit mode only) ───────────────────────────
function StatusRow({
  delay,
  value,
  onChange,
}: {
  delay: number
  value: TaskStatus
  onChange: (status: TaskStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rowRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const pickerSpring = { type: 'spring', duration: 0.35, bounce: 0.12 } as const

  return (
    <motion.div
      ref={rowRef}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay }}
      className="relative flex items-center justify-between"
    >
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full right-0 z-50 w-[180px] pb-1"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={pickerSpring}
            style={{ transformOrigin: 'bottom right' }}
          >
            <div
              className="flex flex-col gap-0.5 rounded-[12px] bg-white p-1"
              style={{ boxShadow: CARD_SHADOW }}
            >
              {TASK_STATUS_OPTIONS.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onChange(status)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center rounded-[8px] px-2 py-1.5 transition-colors duration-100 ${
                    value === status ? 'bg-[#f7f7f7]' : 'hover:bg-[#fafafa]'
                  }`}
                >
                  <TaskStatusBadge status={status} />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 shrink-0">
        <Icon icon="mingcute:flag-2-line" width={20} height={20} className="text-[#A4A4A4] shrink-0" />
        <span className={labelCls}>Status</span>
      </div>

      <motion.button
        type="button"
        aria-label="Select status"
        aria-expanded={open}
        onClick={() => setOpen(prev => !prev)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center gap-1.5 rounded-[8px] px-3 py-2 cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-[#d4d4d4]"
      >
        <motion.div
          className="absolute inset-0 rounded-[8px] bg-[#f7f7f7] pointer-events-none"
          animate={{ opacity: hovered || open ? 1 : 0 }}
          transition={bgFade}
        />
        <span className="relative z-10">
          <TaskStatusBadge status={value} />
        </span>
        <Icon
          icon="mingcute:down-line"
          width={16}
          height={16}
          className={`relative z-10 text-[#A4A4A4] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </motion.button>
    </motion.div>
  )
}

// ─── Color swatches ───────────────────────────────────────
const COLOR_SWATCHES = [
  { color: '#ffffff', border: '#d4d4d0' },
  { color: '#f5f5f4', border: '#d4d4d0' },
  { color: '#a3a3a3', border: null },
  { color: '#57534e', border: null },
  { color: '#1c1917', border: null },
  { color: '#ef4444', border: null },
  { color: '#f97316', border: null },
  { color: '#f59e0b', border: null },
  { color: '#84cc16', border: null },
  { color: '#10b981', border: null },
  { color: '#06b6d4', border: null },
  { color: '#3b82f6', border: null },
  { color: '#6366f1', border: null },
  { color: '#8b5cf6', border: null },
  { color: '#a855f7', border: null },
  { color: '#ec4899', border: null },
  { color: '#f43f5e', border: null },
] as const

// ─── Floating toolbar button ──────────────────────────────
function ToolbarBtn({ ariaLabel, onClick, children }: {
  ariaLabel: string
  onClick:   () => void
  children:  React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onMouseDown={e => e.preventDefault()} // keep selection alive
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 30, padding: '0 8px', minWidth: 30,
        background: 'transparent', border: 'none', cursor: 'pointer',
        borderRadius: 8, flexShrink: 0, transition: 'background 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {children}
    </button>
  )
}

const TbDivider = () => (
  <div style={{ width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 2px', flexShrink: 0 }} />
)

function SaveSuccessCheck() {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_CHECK}
    >
      <motion.path
        d="M4 9L7.5 12.5L14 5.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 24, delay: 0.05 }}
      />
    </motion.svg>
  )
}

function SaveTaskButton({
  disabled,
  isSaving,
  onClick,
  delay,
  label,
}: {
  disabled: boolean
  isSaving: boolean
  onClick: () => void
  delay: number
  label: string
}) {
  const reduced = useReducedMotion()
  const canSubmit = !disabled && !isSaving

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay }}
      className="w-full px-1"
    >
      <motion.button
        type="button"
        onClick={onClick}
        disabled={!canSubmit}
        aria-label={label}
        className="relative flex w-full items-center justify-center overflow-hidden rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#c0d5ff] disabled:cursor-not-allowed"
        style={{
          ...SAVE_BUTTON_SURFACE,
          padding: 10,
          opacity: disabled ? 0.4 : 1,
          transition: 'opacity 200ms ease',
        }}
        whileHover={reduced || !canSubmit ? {} : { opacity: 0.88 }}
        whileTap={reduced || !canSubmit ? {} : { scale: 0.98 }}
        transition={SPRING_PRESS}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isSaving ? (
            <motion.span
              key="label"
              className="font-medium text-[14px] leading-[20px] tracking-[-0.084px] text-white select-none"
              style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
              initial={{ opacity: 0, y: reduced ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.12 } }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
            >
              {label}
            </motion.span>
          ) : (
            <motion.span key="check">
              <SaveSuccessCheck />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}

interface AddTaskPopoverProps {
  mode?: 'create' | 'edit'
  initialValues?: Partial<TaskFormData>
  onClose?: () => void
  onBack?: () => void
  onSave?: (data: TaskFormData) => void | Promise<void>
  applicationId?: string
}

function stripDescriptionHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// ─── Main card ─────────────────────────────────────────────
export function AddTaskPopover({
  mode = 'create',
  initialValues,
  onClose,
  onBack,
  onSave,
  applicationId,
}: AddTaskPopoverProps) {
  const defaultRange = getDefaultTimeRange()
  const isEditMode = mode === 'edit'

  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [date, setDate] = useState(initialValues?.date ?? formatDateStr(new Date()))
  const [timeStart, setTimeStart] = useState(initialValues?.timeStart ?? defaultRange.start)
  const [timeEnd, setTimeEnd] = useState(initialValues?.timeEnd ?? defaultRange.end)
  const [meetingLink, setMeetingLink] = useState(initialValues?.meetingLink ?? '')
  const [status, setStatus] = useState<TaskStatus>(initialValues?.status ?? 'todo')
  const [isSaving, setIsSaving] = useState(false)

  const [cardHovered, setCardHovered] = useState(false)
  const [descHovered, setDescHovered] = useState(false)
  const [descEditing, setDescEditing] = useState(false)
  const [descSelTb,   setDescSelTb]   = useState<{ x: number; y: number } | null>(null)

  const [descColorMode, setDescColorMode] = useState<'text' | 'highlight' | null>(null)
  const [descTextColor, setDescTextColor] = useState('#a3a3a3')
  const [descHlColor,   setDescHlColor]   = useState('#fca5a5')
  const [descLinkMode,  setDescLinkMode]  = useState(false)
  const [descLinkUrl,   setDescLinkUrl]   = useState('')

  const descRef          = useRef<HTMLDivElement>(null)
  const descTbRef        = useRef<HTMLDivElement>(null)
  const descLinkInputRef = useRef<HTMLInputElement>(null)
  const savedDescRange   = useRef<Range | null>(null)
  const [descHtml, setDescHtml] = useState(initialValues?.description ?? '')
  const descSeedRef = useRef(initialValues?.description ?? '')

  const isDescEmpty = (html: string) =>
    html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim().length === 0

  descSeedRef.current = descHtml

  const anyHovered = cardHovered || descHovered || descEditing
  const [portalMounted, setPortalMounted] = useState(false)

  useEffect(() => {
    setPortalMounted(true)
  }, [])

  const updateDescSelectionToolbar = useCallback(() => {
    const sel = window.getSelection()
    const editor = descRef.current

    if (!editor || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setDescSelTb(null)
      return
    }

    const range = sel.getRangeAt(0)
    if (!editor.contains(range.commonAncestorContainer)) {
      setDescSelTb(null)
      return
    }

    const selectedText = sel.toString().trim()
    if (!selectedText) {
      setDescSelTb(null)
      return
    }

    const rect = range.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      setDescSelTb(null)
      return
    }

    savedDescRange.current = range.cloneRange()
    const centerX = rect.left + rect.width / 2
    const clampedX = Math.max(100, Math.min(window.innerWidth - 100, centerX))
    const clampedY = Math.max(52, rect.top)

    setDescSelTb({ x: clampedX, y: clampedY })
  }, [])

  // Seed innerHTML when switching into edit mode
  useEffect(() => {
    if (!descEditing || !descRef.current) return
    const seed = descSeedRef.current
    descRef.current.innerHTML = seed
    descRef.current.focus()
    if (isDescEmpty(seed)) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
    } else {
      const range = document.createRange()
      range.selectNodeContents(descRef.current)
      range.collapse(false)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    }
    setDescSelTb(null)
  }, [descEditing])

  useEffect(() => {
    if (!descEditing) {
      setDescSelTb(null)
      return
    }

    document.addEventListener('selectionchange', updateDescSelectionToolbar)
    return () => document.removeEventListener('selectionchange', updateDescSelectionToolbar)
  }, [descEditing, updateDescSelectionToolbar])

  const handleDescMouseUp = () => {
    requestAnimationFrame(updateDescSelectionToolbar)
  }

  const handleDescKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDescSelTb(null)
      descRef.current?.blur()
      return
    }
    updateDescSelectionToolbar()
  }

  const restoreDescSel = () => {
    if (!savedDescRange.current) return
    const sel = window.getSelection()
    if (sel) { sel.removeAllRanges(); sel.addRange(savedDescRange.current) }
  }

  const applyDescFormat = (cmd: string) => {
    descRef.current?.focus()
    restoreDescSel()
    document.execCommand(cmd)
    if (descRef.current) setDescHtml(descRef.current.innerHTML)
    setDescColorMode(null)
    setDescLinkMode(false)
    setDescSelTb(null)
  }

  const applyDescColor = (color: string) => {
    descRef.current?.focus()
    restoreDescSel()
    if (descColorMode === 'text') {
      document.execCommand('foreColor', false, color)
      setDescTextColor(color)
    } else {
      document.execCommand('hiliteColor', false, color)
      setDescHlColor(color)
    }
    if (descRef.current) setDescHtml(descRef.current.innerHTML)
    setDescColorMode(null)
    setDescSelTb(null)
  }

  const applyDescLink = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return
    const finalUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    descRef.current?.focus()
    restoreDescSel()
    document.execCommand('createLink', false, finalUrl)
    if (descRef.current) setDescHtml(descRef.current.innerHTML)
    setDescLinkMode(false)
    setDescLinkUrl('')
    setDescSelTb(null)
  }

  const enterDescLinkMode = () => {
    setDescLinkMode(true)
    setDescLinkUrl('')
    setDescColorMode(null)
    setTimeout(() => descLinkInputRef.current?.focus(), 30)
  }

  const handleSaveTask = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error('Task title is required')
      return
    }

    const payload: TaskFormData = {
      title: trimmedTitle,
      date,
      timeStart,
      timeEnd,
      meetingLink,
      description: stripDescriptionHtml(descHtml),
      ...(isEditMode ? { status } : {}),
    }

    setIsSaving(true)
    try {
      if (onSave) {
        await onSave(payload)
      } else {
        void applicationId
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      toast.success(isEditMode ? 'Task updated' : 'Task saved')
      onClose?.()
    } catch {
      toast.error(isEditMode ? 'Failed to update task' : 'Failed to save task')
      setIsSaving(false)
    }
  }

  return (
    <>
    <motion.div
      data-application-id={applicationId}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...mountSpring, delay: T.wrapper }}
      className="flex flex-col gap-3 bg-[#f7f7f7] rounded-[20px] pt-3 pb-1 px-1 w-full"
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...mountSpring, delay: T.heading }}
        className="flex items-center justify-between px-3"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {onBack ? (
            <motion.button
              type="button"
              onClick={onBack}
              aria-label="Back to application list"
              className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[#737373] outline-none transition-colors hover:bg-white/70 hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
              whileTap={{ scale: 0.92 }}
            >
              <Icon icon="mingcute:left-line" width={18} height={18} />
            </motion.button>
          ) : null}
          <span className="text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#171717]">
            {isEditMode ? 'Edit task' : 'Add task'}
          </span>
        </div>

        {/* Close button — springs in when card is hovered */}
        {onClose ? (
          <IconSlot visible={anyHovered} transition={iconPop}>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={onClose}
              className="flex items-center focus-visible:outline-none active:scale-[0.96] transition-transform duration-75"
              tabIndex={anyHovered ? 0 : -1}
            >
              <Icon icon="mingcute:close-circle-fill" width={20} height={20} className="text-[#A4A4A4] hover:text-[#5c5c5c] transition-colors duration-150" />
            </button>
          </IconSlot>
        ) : null}
      </motion.div>

      {/* White detail card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...mountSpring, delay: T.card }}
        className="bg-white rounded-[16px] p-3 flex flex-col gap-2"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <Row
          icon="mingcute:notebook-2-line"
          label="Title"
          value={initialValues?.title ?? ''}
          placeholder="Enter task title"
          delay={T.row1}
          chipRounded="rounded-[8px]"
          autoFocusOnMount={!isEditMode}
          onValueChange={setTitle}
        />
        <Row
          icon="mingcute:calendar-2-line"
          label="Date"
          value={initialValues?.date ?? formatDateStr(new Date())}
          delay={T.row2}
          chipRounded="rounded-[8px]"
          pickerType="calendar"
          onValueChange={setDate}
        />
        <TimeRow
          delay={T.row3}
          initialStart={initialValues?.timeStart}
          initialEnd={initialValues?.timeEnd}
          onRangeChange={(start, end) => {
            setTimeStart(start)
            setTimeEnd(end)
          }}
        />
        <DirectInputRow
          icon="mingcute:link-2-line"
          label="Meeting link"
          placeholder="Paste meeting URL"
          delay={T.row4}
          inputType="url"
          ariaLabel="Meeting link"
          initialValue={initialValues?.meetingLink ?? ''}
          onValueChange={setMeetingLink}
        />
        {isEditMode && (
          <StatusRow delay={T.row5} value={status} onChange={setStatus} />
        )}

        {/* Description */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...mountSpring, delay: T.descLabel }}
            className="flex items-center gap-2 py-2"
          >
            <Icon icon="mingcute:list-check-3-line" width={20} height={20} className="text-[#A4A4A4] shrink-0 relative top-px left-px" />
            <span className={labelCls}>Description</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...softFade, delay: T.descBody }}
            className="relative py-2 cursor-text"
            onMouseEnter={() => setDescHovered(true)}
            onMouseLeave={() => setDescHovered(false)}
            onClick={() => !descEditing && setDescEditing(true)}
          >
            <motion.div
              className="absolute inset-0 rounded-[12px] bg-[#f7f7f7] pointer-events-none"
              animate={{ opacity: descHovered || descEditing ? 1 : 0 }}
              transition={bgFade}
            />

            {/* Display mode — plain div, always visible */}
            {!descEditing && (
              isDescEmpty(descHtml) ? (
                <div className="relative z-10 px-3 text-[14px] font-normal leading-5 tracking-[-0.084px] text-[#A4A4A4]">
                  Add a description for this task…
                </div>
              ) : (
                <div
                  className="relative z-10 px-3 text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#5c5c5c]"
                  style={{ textWrap: 'pretty' } as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: descHtml }}
                />
              )
            )}

            {/* Edit mode — contentEditable, mounts on click */}
            {descEditing && (
              <div
                ref={descRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Add a description for this task…"
                onBlur={e => {
                  const rel = e.relatedTarget as Node | null
                  if (rel && descTbRef.current?.contains(rel)) return
                  if (descRef.current) setDescHtml(descRef.current.innerHTML)
                  setDescEditing(false)
                  setDescSelTb(null)
                  setDescColorMode(null)
                  setDescLinkMode(false)
                  setDescLinkUrl('')
                }}
                onMouseUp={handleDescMouseUp}
                onKeyUp={handleDescKeyUp}
                onInput={() => { if (descRef.current) setDescHtml(descRef.current.innerHTML) }}
                className="relative z-10 px-3 text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#5c5c5c] outline-none empty:before:pointer-events-none empty:before:text-[#A4A4A4] empty:before:font-normal empty:before:content-[attr(data-placeholder)]"
                style={{ textWrap: 'pretty' } as React.CSSProperties}
                aria-label="Description"
                aria-multiline="true"
              />
            )}
          </motion.div>
        </div>
      </motion.div>

      <SaveTaskButton
        disabled={!title.trim()}
        isSaving={isSaving}
        onClick={handleSaveTask}
        delay={T.saveBtn}
        label={isEditMode ? 'Update task' : 'Save task'}
      />
    </motion.div>

    {/* Portaled above popover — avoids transform/overflow clipping from Radix */}
    {portalMounted &&
      createPortal(
        <AnimatePresence>
          {descSelTb && descEditing && (
            <motion.div
              key="desc-toolbar"
              ref={descTbRef}
              role="toolbar"
              aria-label="Text formatting"
              className="pointer-events-auto fixed z-[9999]"
              style={{
                left:            descSelTb.x,
                top:             descSelTb.y - 52,
                display:         'flex',
                alignItems:      'center',
                height:          40,
                width:           descLinkMode ? 300 : undefined,
                backgroundColor: '#1c1c1c',
                borderRadius:    12,
                padding:         '0 5px',
                gap:             0,
                boxShadow:       '0 8px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.18)',
                userSelect:      'none',
                overflow:        'hidden',
                transform:         'translateX(-50%)',
                transformOrigin: 'bottom center',
              }}
              initial={{ opacity: 0, scale: 0.88, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 4 }}
              transition={{ type: 'spring', duration: 0.22, bounce: 0 }}
            >
              {descColorMode ? (
                <>
                  <ToolbarBtn ariaLabel="Back" onClick={() => setDescColorMode(null)}>
                    <Icon icon="mingcute:left-line" width={13} color="#fff" />
                  </ToolbarBtn>
                  <TbDivider />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, overflowX: 'auto', padding: '0 4px', scrollbarWidth: 'none' as const }}>
                    {COLOR_SWATCHES.map(({ color, border }) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Color ${color}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => applyDescColor(color)}
                        style={{
                          width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer',
                          backgroundColor: color, flexShrink: 0,
                          outline: border ? `1.5px solid ${border}` : 'none',
                          outlineOffset: border ? '-1px' : '0',
                          transition: 'transform 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      />
                    ))}
                  </div>
                </>
              ) : descLinkMode ? (
                <>
                  <ToolbarBtn ariaLabel="Back" onClick={() => { setDescLinkMode(false); setDescLinkUrl('') }}>
                    <Icon icon="mingcute:left-line" width={13} color="#fff" />
                  </ToolbarBtn>
                  <TbDivider />
                  <Icon icon="mingcute:link-line" width={14} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0, marginLeft: 2 }} />
                  <input
                    ref={descLinkInputRef}
                    type="url"
                    value={descLinkUrl}
                    onChange={e => setDescLinkUrl(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  { e.preventDefault(); applyDescLink(descLinkUrl) }
                      if (e.key === 'Escape') { setDescLinkMode(false); setDescLinkUrl('') }
                    }}
                    placeholder="Paste link…"
                    style={{
                      flex: 1, minWidth: 0,
                      background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 13, color: '#fff', fontFamily: 'inherit', caretColor: '#fff',
                    }}
                  />
                  <ToolbarBtn ariaLabel="Apply link" onClick={() => applyDescLink(descLinkUrl)}>
                    <Icon icon="mingcute:check-line" width={15} color="#fff" />
                  </ToolbarBtn>
                </>
              ) : (
                <>
                  <ToolbarBtn ariaLabel="Text color" onClick={() => setDescColorMode('text')}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: '#fff' }}>Text</span>
                    <span style={{ width: 11, height: 11, borderRadius: '50%', flexShrink: 0, backgroundColor: descTextColor, border: descTextColor === '#ffffff' ? '1px solid rgba(255,255,255,0.4)' : 'none', marginLeft: 3 }} />
                  </ToolbarBtn>
                  <ToolbarBtn ariaLabel="Highlight" onClick={() => setDescColorMode('highlight')}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: '#fff' }}>Highlight</span>
                    <span style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0, backgroundColor: descHlColor, marginLeft: 3 }} />
                  </ToolbarBtn>
                  <TbDivider />
                  <ToolbarBtn ariaLabel="Link" onClick={enterDescLinkMode}>
                    <Icon icon="mingcute:link-line" width={15} color="#fff" />
                  </ToolbarBtn>
                  <TbDivider />
                  <ToolbarBtn ariaLabel="Bold" onClick={() => applyDescFormat('bold')}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>B</span>
                  </ToolbarBtn>
                  <ToolbarBtn ariaLabel="Italic" onClick={() => applyDescFormat('italic')}>
                    <span style={{ fontSize: 14, fontStyle: 'italic', color: '#fff', lineHeight: 1, fontFamily: 'Georgia, serif' }}>I</span>
                  </ToolbarBtn>
                  <ToolbarBtn ariaLabel="Strikethrough" onClick={() => applyDescFormat('strikeThrough')}>
                    <span style={{ fontSize: 14, textDecoration: 'line-through', color: '#fff', lineHeight: 1 }}>S</span>
                  </ToolbarBtn>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}