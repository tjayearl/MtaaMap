import { useEffect, useMemo, useState } from 'react'
import type { CommunityComment, CommunityThread } from '../types'

interface CommunityPanelProps {
  isOpen: boolean
  initialPointId: string | null
  onClose: () => void
  onSelectPoint: (pointId: string) => void
}

const INITIAL_THREADS: CommunityThread[] = [
  {
    pointId: 'nh-kirigiti-1',
    title: 'Near Kirigiti Stadium',
    area: 'Kirigiti, Kiambu',
    commentCount: 4,
    latestSnippet: 'The road is much better after the recent drainage work, but visibility gets poor at dusk.',
    latestActivity: '8m ago',
    comments: [
      { id: 'c1', author: 'Asha', body: 'The road is much better after the recent drainage work, but visibility gets poor at dusk.', createdAt: '8m ago' },
      { id: 'c2', author: 'Juma', body: 'There is a sharp bend near the stadium and it feels unsafe at night.', createdAt: '25m ago', parentId: 'c1' },
      { id: 'c3', author: 'Miriam', body: 'I walk this route every evening and the lighting is the main issue.', createdAt: '1h ago' },
      { id: 'c4', author: 'Ben', body: 'There is better parking on the eastern side when events are on.', createdAt: '2h ago' },
    ],
  },
  {
    pointId: 'pr-kirigiti-1',
    title: 'Replace with real kiosk name',
    area: 'Kirigiti, Kiambu',
    commentCount: 3,
    latestSnippet: 'Tomato prices were lower yesterday, but the cabbage quality has gone down this week.',
    latestActivity: '1h ago',
    comments: [
      { id: 'c5', author: 'Njeri', body: 'Tomato prices were lower yesterday, but the cabbage quality has gone down this week.', createdAt: '1h ago' },
      { id: 'c6', author: 'Kip', body: 'The onions looked fresher in the morning rush than later in the day.', createdAt: '2h ago', parentId: 'c5' },
      { id: 'c7', author: 'Akin', body: 'This stall is still the most reliable option if you know what to ask for.', createdAt: '3h ago' },
    ],
  },
]

export default function CommunityPanel({ isOpen, initialPointId, onClose, onSelectPoint }: CommunityPanelProps) {
  const [threads, setThreads] = useState<CommunityThread[]>(INITIAL_THREADS)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(initialPointId ?? INITIAL_THREADS[0].pointId)
  const [draft, setDraft] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialPointId) {
      setSelectedPointId(initialPointId)
    }
  }, [initialPointId])

  const selectedThread = useMemo(() => {
    const match = threads.find((thread) => thread.pointId === selectedPointId)
    return match ?? threads[0]
  }, [selectedPointId, threads])

  const commentsByParent = useMemo(() => {
    const grouped = new Map<string | undefined, CommunityComment[]>()

    selectedThread.comments.forEach((comment) => {
      const key = comment.parentId
      const existing = grouped.get(key) ?? []
      existing.push(comment)
      grouped.set(key, existing)
    })

    return grouped
  }, [selectedThread])

  const handleAddOpinion = () => {
    const value = draft.trim()
    if (!value) return

    const newComment: CommunityComment = {
      id: `local-${Date.now()}`,
      author: 'You',
      body: value,
      createdAt: 'just now',
    }

    setThreads((prev) => prev.map((thread) => thread.pointId === selectedThread.pointId
      ? {
          ...thread,
          commentCount: thread.commentCount + 1,
          latestSnippet: value,
          latestActivity: 'just now',
          comments: [...thread.comments, newComment],
        }
      : thread))
    setDraft('')
  }

  const handleAddReply = (parentCommentId: string) => {
    const value = (replyDrafts[parentCommentId] ?? '').trim()
    if (!value) return

    const newReply: CommunityComment = {
      id: `reply-${Date.now()}`,
      author: 'You',
      body: value,
      createdAt: 'just now',
      parentId: parentCommentId,
    }

    setThreads((prev) => prev.map((thread) => thread.pointId === selectedThread.pointId
      ? {
          ...thread,
          commentCount: thread.commentCount + 1,
          latestSnippet: value,
          latestActivity: 'just now',
          comments: [...thread.comments, newReply],
        }
      : thread))
    setReplyDrafts((prev) => ({ ...prev, [parentCommentId]: '' }))
    setReplyingToId(null)
  }

  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-30 bg-[#0b1014] text-paper">
      <div className="mx-auto flex h-full max-w-7xl flex-col border border-hairline bg-[#111b22]">
        <header className="flex items-center justify-between border-b border-hairline bg-[#202c33] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric text-[14px] font-semibold text-white">
              M
            </div>
            <div>
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-fog">Community</p>
              <h1 className="text-[18px] font-display font-semibold text-paper">MtaaMap chat</h1>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full border border-hairline bg-[#1f2b33] px-3 py-1.5 text-[12px] text-fog hover:text-paper">
            Close
          </button>
        </header>

        <div className="grid flex-1 overflow-hidden lg:grid-cols-[280px_minmax(0,1fr)_280px]">
          <aside className="hidden border-r border-hairline bg-[#111b22] lg:block">
            <div className="border-b border-hairline p-3">
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-fog">Places</p>
            </div>
            <div className="space-y-2 p-3">
              {threads.map((thread) => (
                <button
                  key={thread.pointId}
                  onClick={() => {
                    setSelectedPointId(thread.pointId)
                    onSelectPoint(thread.pointId)
                  }}
                  className={[
                    'flex w-full flex-col rounded-2xl border p-3 text-left transition-colors',
                    thread.pointId === selectedThread.pointId
                      ? 'border-electric bg-electric/10'
                      : 'border-hairline bg-[#172229] hover:border-electric/60',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-[13px] font-medium text-paper">{thread.title}</span>
                    <span className="text-[10px] text-fog">{thread.latestActivity}</span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-[12px] text-mist">{thread.latestSnippet}</p>
                </button>
              ))}
            </div>
          </aside>

          <main className="flex min-h-0 flex-col bg-[#0b141a]">
            <div className="flex items-center justify-between border-b border-hairline bg-[#202c33] px-4 py-3">
              <div>
                <h2 className="text-[18px] font-display font-semibold text-paper">{selectedThread.title}</h2>
                <p className="text-[11px] text-fog">{selectedThread.area}</p>
              </div>
              <span className="rounded-full border border-hairline bg-[#111b22] px-2.5 py-1 text-[10px] text-mist">
                {selectedThread.commentCount} chats
              </span>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.06),_transparent_40%)] p-4">
              {(commentsByParent.get(undefined) ?? []).map((comment) => {
                const isMine = comment.author === 'You'
                const replies = commentsByParent.get(comment.id) ?? []

                return (
                  <div key={comment.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl border px-3 py-2.5 ${isMine ? 'border-electric/60 bg-electric/15' : 'border-hairline bg-[#1f2b33]'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-medium text-paper">{comment.author}</span>
                        <span className="text-[9px] text-fog">{comment.createdAt}</span>
                      </div>
                      <p className="mt-2 text-[13px] leading-6 text-mist">{comment.body}</p>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline pt-2">
                        <button
                          onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                          className="text-[10px] font-medium text-electric hover:text-electric-bright"
                        >
                          Reply
                        </button>
                        <span className="text-[10px] text-fog">{replies.length} replies</span>
                      </div>

                      {replies.length > 0 && (
                        <div className="mt-3 space-y-2 border-l border-hairline pl-3">
                          {replies.map((reply) => (
                            <div key={reply.id} className={`rounded-xl px-2.5 py-2 ${reply.author === 'You' ? 'bg-electric/10' : 'bg-[#111b22]'}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-medium text-paper">{reply.author}</span>
                                <span className="text-[9px] text-fog">{reply.createdAt}</span>
                              </div>
                              <p className="mt-1 text-[12px] leading-5 text-mist">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyingToId === comment.id && (
                        <div className="mt-3 rounded-xl border border-hairline bg-[#0f171c] p-2.5">
                          <textarea
                            value={replyDrafts[comment.id] ?? ''}
                            onChange={(event) => setReplyDrafts((prev) => ({ ...prev, [comment.id]: event.target.value }))}
                            rows={2}
                            placeholder="Reply to this opinion..."
                            className="w-full rounded-lg border border-hairline bg-[#111b22] px-2.5 py-2 text-[12px] text-paper placeholder:text-fog outline-none focus:border-electric"
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <button onClick={() => setReplyingToId(null)} className="rounded-lg border border-hairline px-2.5 py-1.5 text-[11px] text-fog">
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddReply(comment.id)}
                              className="rounded-lg bg-electric px-2.5 py-1.5 text-[11px] font-medium text-white"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-hairline bg-[#202c33] p-3">
              <div className="mb-2 flex items-center gap-2 rounded-2xl border border-hairline bg-[#111b22] px-3 py-2.5">
                <button className="text-[18px] text-fog">😊</button>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={1}
                  placeholder="What&apos;s your opinion?"
                  className="max-h-28 min-h-[20px] flex-1 resize-none overflow-hidden bg-transparent text-[13px] text-paper placeholder:text-fog outline-none"
                />
                <button
                  onClick={handleAddOpinion}
                  className="rounded-full bg-electric px-3 py-2 text-[12px] font-medium text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </main>

          <aside className="border-l border-hairline bg-[#111b22] lg:block">
            <div className="border-b border-hairline p-3">
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-fog">Quick picks</p>
            </div>
            <div className="space-y-3 p-3">
              {threads.map((thread) => (
                <button
                  key={`${thread.pointId}-side`}
                  onClick={() => {
                    setSelectedPointId(thread.pointId)
                    onSelectPoint(thread.pointId)
                  }}
                  className="w-full rounded-2xl border border-hairline bg-[#172229] p-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-paper">{thread.title}</span>
                    <span className="rounded-full bg-electric/10 px-1.5 py-0.5 text-[10px] text-electric">{thread.commentCount}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-fog">{thread.area}</p>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
