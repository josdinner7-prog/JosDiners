import React, { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useToast } from '../../components/ToastNotification'

export default function MessagesPage(props) {
  const context = useOutletContext() || {}
  const { showToast } = useToast()

  const staffUser = props.staffUser || context.staffUser
  const isDarkMode = props.isDarkMode ?? context.isDarkMode ?? false

  const [messages, setMessages] = useState([])
  const [activeMessageId, setActiveMessageId] = useState(null)
  const [replyInput, setReplyInput] = useState('')
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false)
  const [newHandoffSubject, setNewHandoffSubject] = useState('')
  const [newHandoffBody, setNewHandoffBody] = useState('')
  const [newHandoffPriority, setNewHandoffPriority] = useState('MEDIUM')

  const handleSendReply = (e) => {
    e.preventDefault()
    if (!replyInput.trim()) return

    setMessages(prev => prev.map(m => {
      if (m.id === activeMessageId) {
        return {
          ...m,
          unread: false,
          replies: [...(m.replies || []), { sender: `Front of House Staff (${staffUser?.username || 'You'})`, time: 'Just now', text: replyInput.trim() }]
        }
      }
      return m
    }))

    setReplyInput('')
    showToast('Reply logged to communication thread.', 'success')
  }

  const handleCreateHandoff = (e) => {
    e.preventDefault()
    if (!newHandoffSubject || !newHandoffBody) {
      showToast('Subject and Details are required.', 'error')
      return
    }

    const newNote = {
      id: Date.now(),
      priority: newHandoffPriority,
      type: 'Shift Handoff Note',
      sender: `${staffUser?.username || 'Staff User'} (${staffUser?.role || 'Front of House'})`,
      contact: 'Internal Desk',
      subject: newHandoffSubject.trim(),
      time: 'Just now',
      unread: false,
      message: newHandoffBody.trim(),
      replies: []
    }

    setMessages(prev => [newNote, ...prev])
    setActiveMessageId(newNote.id)
    setIsHandoffModalOpen(false)
    setNewHandoffSubject('')
    setNewHandoffBody('')
    setNewHandoffPriority('MEDIUM')
    showToast('Internal Front of House log note posted!', 'success')
  }

  const activeMessageObj = messages.find(m => m.id === activeMessageId) || messages[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-10 text-xs animate-in fade-in duration-150">
      <div className={`lg:col-span-4 p-3 rounded-xl border shadow-sm space-y-2 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
        <div className="flex justify-between items-center border-b pb-2 border-slate-400 dark:border-slate-600">
          <h3 className="font-extrabold text-xs">Communications Inbox</h3>
          <button
            onClick={() => setIsHandoffModalOpen(true)}
            className="px-2 py-0.5 rounded bg-[#C8102E] text-white text-[10px] font-bold shadow-2xs hover:bg-[#9B0B21] cursor-pointer"
          >
            + Shift Note
          </button>
        </div>

        <div className="space-y-1.5">
          {messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => setActiveMessageId(msg.id)}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${activeMessageId === msg.id ? 'border-[#C8102E] bg-[#C8102E]/10' : 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700'}`}
            >
              <div className="flex justify-between text-[9px] font-bold mb-0.5">
                <span className="text-amber-600 dark:text-amber-400">{msg.type}</span>
                <span className="text-slate-400">{msg.time}</span>
              </div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{msg.subject}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">{msg.sender}</p>
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <span className="material-icons text-3xl block mb-1">chat</span>
              <p className="text-[11px]">No messages or shift notes.</p>
            </div>
          )}
        </div>
      </div>

      <div className={`lg:col-span-8 p-4 rounded-xl border shadow-sm flex flex-col justify-between space-y-3 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}>
        {activeMessageObj ? (
          <div>
            <div className="border-b pb-2 border-slate-400 dark:border-slate-600">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">{activeMessageObj?.type}</span>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">{activeMessageObj?.subject}</h3>
              <p className="text-[11px] text-slate-400">From: {activeMessageObj?.sender} ({activeMessageObj?.contact})</p>
            </div>

            <div className="my-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
              {activeMessageObj?.message}
            </div>

            {activeMessageObj?.replies?.length > 0 && (
              <div className="space-y-1.5 border-t pt-2 border-slate-300 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Replies:</span>
                {activeMessageObj.replies.map((rep, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-xs border border-slate-300 dark:border-slate-700">
                    <div className="flex justify-between text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <span>{rep.sender}</span>
                      <span>{rep.time}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{rep.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <span className="material-icons text-4xl block mb-2 opacity-50">forum</span>
            <p className="font-bold">Select a message or post a new shift note</p>
          </div>
        )}

        {activeMessageObj && (
          <form onSubmit={handleSendReply} className="space-y-2 border-t pt-2 border-slate-300 dark:border-slate-700">
            <textarea
              rows={2}
              placeholder="Type response..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              className={`w-full p-2 rounded-lg text-xs font-semibold border ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400 text-slate-900'}`}
            ></textarea>
            <div className="flex justify-end">
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#C8102E] text-white font-bold text-xs hover:bg-[#9B0B21] shadow-2xs cursor-pointer">
                Send Reply
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Internal Handoff Note Modal */}
      {isHandoffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateHandoff}
            className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border space-y-4 ${isDarkMode ? 'bg-[#1C2541] border-slate-600 text-white' : 'bg-white border-slate-400 text-slate-900'}`}
          >
            <div className="flex justify-between items-center border-b pb-2 border-slate-400 dark:border-slate-600">
              <h3 className="font-black text-sm">Post Front of House Log Note</h3>
              <button type="button" onClick={() => setIsHandoffModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <span className="material-icons text-base">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority</label>
                <select
                  value={newHandoffPriority}
                  onChange={(e) => setNewHandoffPriority(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Reservation or Kitchen Alert..."
                  value={newHandoffSubject}
                  onChange={(e) => setNewHandoffSubject(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Details *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write shift note details..."
                  value={newHandoffBody}
                  onChange={(e) => setNewHandoffBody(e.target.value)}
                  className={`w-full p-2 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-400'}`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md cursor-pointer">
                Post Note
              </button>
              <button type="button" onClick={() => setIsHandoffModalOpen(false)} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 font-bold text-xs cursor-pointer">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
