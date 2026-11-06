import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import type { Generation } from '../shared/schema'
import type { getTranslation } from '../lib/translations'

type Messages = ReturnType<typeof getTranslation>
export type HistoryTool = 'cold_email' | 'proposal' | 'contract' | 'social_pack'
export type HistoryToolFilter = 'all' | HistoryTool

interface HistoryPanelProps {
  generations: Generation[]
  loading: boolean
  refreshing: boolean
  query: string
  tool: HistoryToolFilter
  filterActive: boolean
  labels: Record<HistoryTool, string>
  messages: Messages
  onQueryChange: (value: string) => void
  onToolChange: (tool: HistoryToolFilter) => void
  onClose: () => void
  onLoad: (generation: Generation) => void
  onDelete: (id: number) => Promise<boolean>
}

const TOOLS: HistoryTool[] = ['cold_email', 'proposal', 'contract', 'social_pack']

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Fall through to the selection fallback for browsers that block the async API.
  }

  try {
    const area = document.createElement('textarea')
    area.value = value
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.top = '0'
    area.style.left = '-9999px'
    document.body.appendChild(area)
    area.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(area)
    return copied
  } catch {
    return false
  }
}

function previewText(output: string): string {
  const flat = output.replace(/\s+/g, ' ').trim()
  if (flat.length <= 180) return flat
  return `${flat.slice(0, 177)}…`
}

function formatCount(template: string, count: number): string {
  return template.replace('{count}', String(count))
}

export function HistoryPanel({
  generations,
  loading,
  refreshing,
  query,
  tool,
  filterActive,
  labels,
  messages,
  onQueryChange,
  onToolChange,
  onClose,
  onLoad,
  onDelete,
}: HistoryPanelProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()
  const [pending, setPending] = useState<Generation | null>(null)
  const pendingRef = useRef<Generation | null>(null)
  pendingRef.current = pending
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copyErrorId, setCopyErrorId] = useState<number | null>(null)
  const [notice, setNotice] = useState('')
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success')
  const noticeTimer = useRef<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || pendingRef.current) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const showNotice = (text: string, tone: 'success' | 'error') => {
    setNotice(text)
    setNoticeTone(tone)
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(''), 2500)
  }

  const copyGeneration = async (generation: Generation) => {
    const copied = await copyText(generation.output)
    if (copied) {
      setCopiedId(generation.id)
      setCopyErrorId(null)
      showNotice(messages.copiedToClipboard, 'success')
      window.setTimeout(() => {
        setCopiedId((current) => (current === generation.id ? null : current))
      }, 2000)
      return
    }
    setCopiedId(null)
    setCopyErrorId(generation.id)
    showNotice(messages.copyFailed, 'error')
  }

  const confirmDelete = async () => {
    if (!pending || deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      const removed = await onDelete(pending.id)
      if (!removed) {
        setDeleteError(messages.deleteFailed)
        return
      }
      setPending(null)
      showNotice(messages.generationDeleted, 'success')
    } catch {
      setDeleteError(messages.deleteFailed)
    } finally {
      setDeleting(false)
    }
  }

  const filters: Array<{ id: HistoryToolFilter; label: string }> = [
    { id: 'all', label: messages.allTools },
    ...TOOLS.map((id) => ({ id, label: labels[id] })),
  ]

  return (
    <aside
      id="history-panel"
      className="history-panel"
      aria-labelledby={titleId}
      style={panelStyle}
      data-testid="panel-history"
    >
      <style>{panelCss}</style>
      <div style={headerStyle}>
        <h2 id={titleId} style={titleStyle}>
          {messages.generationHistory}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={messages.closeHistory}
          style={iconButtonStyle}
          data-testid="button-close-history"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form
        role="search"
        style={searchFormStyle}
        onSubmit={(event) => event.preventDefault()}
      >
        <label htmlFor="history-search" style={labelStyle}>
          {messages.searchHistory}
        </label>
        <div style={{ position: 'relative' }}>
          <input
            ref={searchRef}
            id="history-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && query) {
                event.stopPropagation()
                onQueryChange('')
              }
            }}
            placeholder={messages.searchHistoryPlaceholder}
            autoComplete="off"
            style={searchInputStyle}
            data-testid="input-history-search"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              aria-label={messages.clearSearch}
              style={clearButtonStyle}
              data-testid="button-clear-history-search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div role="group" aria-label={messages.filterByTool} style={filterRowStyle}>
          {filters.map((filter) => {
            const selected = tool === filter.id
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToolChange(filter.id)}
                style={filterButtonStyle(selected)}
                data-testid={`button-filter-${filter.id}`}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </form>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{ ...noticeStyle(noticeTone), margin: '12px 20px 0' }}
          data-testid="text-history-status"
        >
          {notice}
        </div>
      )}
      {refreshing && !loading && (
        <p style={{ ...updatingStyle, margin: '8px 20px 0' }} data-testid="text-history-updating">
          {messages.updatingHistory}
        </p>
      )}

      <div style={listRegionStyle} aria-busy={loading || refreshing}>
        {loading ? (
          <div style={emptyStyle}>{messages.loading}</div>
        ) : generations.length === 0 ? (
          <div style={emptyStyle}>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              {filterActive ? messages.noMatches : messages.noHistory}
            </p>
          </div>
        ) : (
          <>
            <p style={countStyle} data-testid="text-history-count">
              {formatCount(filterActive ? messages.historyMatches : messages.historyCount, generations.length)}
            </p>
            <ul style={listStyle}>
              {generations.map((generation) => {
                const label = labels[generation.toolType as HistoryTool] || generation.toolType
                const created = generation.createdAt ? new Date(generation.createdAt) : null
                const copied = copiedId === generation.id
                const copyFailed = copyErrorId === generation.id
                return (
                  <li key={generation.id} style={cardStyle} data-testid={`history-item-${generation.id}`}>
                    <div style={cardHeaderStyle}>
                      <span style={badgeStyle}>{label}</span>
                      {created && !Number.isNaN(created.getTime()) && (
                        <time dateTime={created.toISOString()} style={dateStyle}>
                          {created.toLocaleDateString()}
                        </time>
                      )}
                    </div>
                    <p style={previewStyle}>{previewText(generation.output)}</p>
                    <div style={actionRowStyle}>
                      <button
                        type="button"
                        onClick={() => onLoad(generation)}
                        style={loadButtonStyle}
                        data-testid={`button-load-${generation.id}`}
                      >
                        {messages.load}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyGeneration(generation)}
                        aria-label={`${messages.copy} ${label}`}
                        style={copyButtonStyle(copied, copyFailed)}
                        data-testid={`button-copy-history-${generation.id}`}
                      >
                        {copied ? messages.copied : copyFailed ? messages.copyFailedShort : messages.copy}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError('')
                          setPending(generation)
                        }}
                        style={deleteButtonStyle}
                        data-testid={`button-delete-${generation.id}`}
                      >
                        {messages.delete}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {pending && (
        <DeleteDialog
          title={messages.confirmDeleteTitle}
          body={messages.confirmDeleteBody}
          detail={labels[pending.toolType as HistoryTool] || pending.toolType}
          confirmLabel={deleting ? messages.deleting : messages.delete}
          cancelLabel={messages.cancel}
          error={deleteError}
          busy={deleting}
          onCancel={() => {
            if (deleting) return
            setPending(null)
            setDeleteError('')
          }}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </aside>
  )
}

function DeleteDialog({
  title,
  body,
  detail,
  confirmLabel,
  cancelLabel,
  error,
  busy,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  detail: string
  confirmLabel: string
  cancelLabel: string
  error: string
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const titleId = useId()
  const bodyId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    cancelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCancelRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLButtonElement>('button:not([disabled])')
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div
      style={backdropStyle}
      onClick={onCancel}
      data-testid="modal-delete-backdrop"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        style={dialogStyle}
        onClick={(event) => event.stopPropagation()}
        data-testid="dialog-delete-generation"
      >
        <h3 id={titleId} style={dialogTitleStyle}>
          {title}
        </h3>
        <p id={bodyId} style={dialogBodyStyle}>
          {body}
        </p>
        <p style={dialogDetailStyle}>{detail}</p>
        {error && (
          <p role="alert" style={dialogErrorStyle} data-testid="text-delete-error">
            {error}
          </p>
        )}
        <div style={dialogActionsStyle}>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            style={dialogCancelStyle}
            data-testid="button-cancel-delete"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={dialogConfirmStyle}
            data-testid="button-confirm-delete"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const panelCss = `
.history-panel button:focus-visible,
.history-panel input:focus-visible {
  outline: 2px solid rgb(99, 102, 241);
  outline-offset: 2px;
}
.history-panel input[type="search"]::-webkit-search-cancel-button,
.history-panel input[type="search"]::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}
@media (max-width: 640px) {
  .history-panel {
    width: 100vw !important;
  }
}
`

const panelStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: '420px',
  maxWidth: '100vw',
  height: '100vh',
  backgroundColor: 'rgb(255, 255, 255)',
  borderLeft: '1px solid rgb(226, 232, 240)',
  boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid rgb(226, 232, 240)',
  gap: '12px',
}

const titleStyle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'rgb(15, 23, 42)',
  margin: 0,
}

const iconButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '44px',
  minHeight: '44px',
  padding: '6px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'rgb(100, 116, 139)',
}

const searchFormStyle: CSSProperties = {
  padding: '16px 20px 8px',
  borderBottom: '1px solid rgb(226, 232, 240)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: 'rgb(51, 65, 85)',
}

const searchInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: '44px',
  padding: '10px 40px 10px 12px',
  fontSize: '0.875rem',
  color: 'rgb(15, 23, 42)',
  backgroundColor: 'rgb(255, 255, 255)',
  border: '1px solid rgb(226, 232, 240)',
  borderRadius: '6px',
}

const clearButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '50%',
  right: '4px',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: 'transparent',
  color: 'rgb(100, 116, 139)',
  cursor: 'pointer',
}

const filterRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '12px',
}

function filterButtonStyle(selected: boolean): CSSProperties {
  return {
    minHeight: '44px',
    padding: '6px 12px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: selected ? 'rgb(255, 255, 255)' : 'rgb(71, 85, 105)',
    backgroundColor: selected ? 'rgb(99, 102, 241)' : 'rgb(255, 255, 255)',
    border: `1px solid ${selected ? 'rgb(99, 102, 241)' : 'rgb(226, 232, 240)'}`,
    borderRadius: '999px',
    cursor: 'pointer',
  }
}

const listRegionStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}

const countStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: '0.75rem',
  fontWeight: 500,
  color: 'rgb(100, 116, 139)',
}

const emptyStyle: CSSProperties = {
  textAlign: 'center',
  color: 'rgb(100, 116, 139)',
  padding: '40px 8px',
}

const updatingStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: '0.75rem',
  color: 'rgb(99, 102, 241)',
}

function noticeStyle(tone: 'success' | 'error'): CSSProperties {
  const success = tone === 'success'
  return {
    marginBottom: '12px',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: success ? 'rgb(22, 101, 52)' : 'rgb(153, 27, 27)',
    backgroundColor: success ? 'rgb(240, 253, 244)' : 'rgb(254, 242, 242)',
    border: `1px solid ${success ? 'rgb(187, 247, 208)' : 'rgb(254, 202, 202)'}`,
  }
}

const cardStyle: CSSProperties = {
  padding: '14px',
  backgroundColor: 'rgb(248, 250, 252)',
  borderRadius: '6px',
  border: '1px solid rgb(226, 232, 240)',
}

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '8px',
  marginBottom: '8px',
}

const badgeStyle: CSSProperties = {
  display: 'inline-block',
  padding: '4px 8px',
  fontSize: '0.6875rem',
  fontWeight: 600,
  backgroundColor: 'rgb(238, 242, 255)',
  color: 'rgb(79, 70, 229)',
  borderRadius: '4px',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
}

const dateStyle: CSSProperties = {
  fontSize: '0.6875rem',
  color: 'rgb(148, 163, 184)',
  whiteSpace: 'nowrap',
}

const previewStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'rgb(51, 65, 85)',
  lineHeight: 1.5,
  margin: '0 0 12px',
  overflowWrap: 'anywhere',
}

const actionRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const actionButtonBase: CSSProperties = {
  flex: '1 1 90px',
  minHeight: '44px',
  padding: '8px 10px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  backgroundColor: 'rgb(255, 255, 255)',
}

const loadButtonStyle: CSSProperties = {
  ...actionButtonBase,
  color: 'rgb(79, 70, 229)',
  border: '1px solid rgb(199, 210, 254)',
}

function copyButtonStyle(copied: boolean, failed: boolean): CSSProperties {
  if (copied) {
    return {
      ...actionButtonBase,
      color: 'rgb(22, 163, 74)',
      backgroundColor: 'rgb(240, 253, 244)',
      border: '1px solid rgb(187, 247, 208)',
    }
  }
  if (failed) {
    return {
      ...actionButtonBase,
      color: 'rgb(220, 38, 38)',
      backgroundColor: 'rgb(254, 242, 242)',
      border: '1px solid rgb(254, 202, 202)',
    }
  }
  return {
    ...actionButtonBase,
    color: 'rgb(51, 65, 85)',
    border: '1px solid rgb(226, 232, 240)',
  }
}

const deleteButtonStyle: CSSProperties = {
  ...actionButtonBase,
  color: 'rgb(220, 38, 38)',
  border: '1px solid rgb(254, 202, 202)',
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  padding: '16px',
}

const dialogStyle: CSSProperties = {
  width: 'min(420px, 100%)',
  backgroundColor: 'rgb(255, 255, 255)',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}

const dialogTitleStyle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'rgb(15, 23, 42)',
}

const dialogBodyStyle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: '0.9375rem',
  lineHeight: 1.5,
  color: 'rgb(71, 85, 105)',
}

const dialogDetailStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'rgb(79, 70, 229)',
}

const dialogErrorStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: '0.8125rem',
  color: 'rgb(185, 28, 28)',
}

const dialogActionsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'flex-end',
}

const dialogCancelStyle: CSSProperties = {
  minHeight: '44px',
  padding: '8px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'rgb(71, 85, 105)',
  backgroundColor: 'rgb(255, 255, 255)',
  border: '1px solid rgb(226, 232, 240)',
  borderRadius: '8px',
  cursor: 'pointer',
}

const dialogConfirmStyle: CSSProperties = {
  minHeight: '44px',
  padding: '8px 16px',
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'rgb(255, 255, 255)',
  backgroundColor: 'rgb(220, 38, 38)',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
}
