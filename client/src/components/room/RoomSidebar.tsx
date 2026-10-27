import React, { useState, useRef, useEffect } from 'react';
import { Room, ChatMessage, Participant, User } from '../../types';
import { useRoomStore } from '../../stores/roomStore';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../services/socket';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  MessageSquare,
  BookOpen,
  Share2,
  Users,
  Send,
  Plus,
  Bookmark,
  Check,
  Lock,
  Unlock,
  MicOff,
  UserX,
  Crown,
  Video,
  FileText,
  Lightbulb,
  X,
  Sparkles,
} from 'lucide-react';

interface RoomSidebarProps {
  room: Room;
  onClose: () => void;
  onOpenProfile: (user: User) => void;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({
  room,
  onClose,
  onOpenProfile,
}) => {
  const currentUser = useAuthStore((s) => s.user);
  const {
    chatMessages,
    addChatMessage,
    activeSidebarTab,
    setActiveSidebarTab,
    setSharedMedia,
  } = useRoomStore();

  const [messageText, setMessageText] = useState('');
  const [showVocabModal, setShowVocabModal] = useState(false);
  const [vocabOriginal, setVocabOriginal] = useState('');
  const [vocabCorrection, setVocabCorrection] = useState('');
  const [vocabNote, setVocabNote] = useState('');
  const [whiteboardInput, setWhiteboardInput] = useState(
    room.sharedMedia?.whiteboardText || ''
  );
  const [youtubeUrl, setYoutubeUrl] = useState(room.sharedMedia?.url || '');
  const [customTopic, setCustomTopic] = useState(room.sharedMedia?.topicPrompt || '');
  const [savedFlashcards, setSavedFlashcards] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const isHost = room.hostId === currentUser?.uid;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser) return;

    const msgData = {
      roomId: room.id,
      text: messageText.trim(),
      type: 'chat' as const,
    };

    getSocket().emit('chat:message', msgData);
    setMessageText('');
  };

  const handleSendCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabCorrection.trim() || !currentUser) return;

    const msgData = {
      roomId: room.id,
      text: `Correction: "${vocabOriginal}" → "${vocabCorrection}"`,
      type: 'correction' as const,
      original: vocabOriginal.trim(),
      correction: vocabCorrection.trim(),
      note: vocabNote.trim(),
    };

    getSocket().emit('chat:message', msgData);
    setVocabOriginal('');
    setVocabCorrection('');
    setVocabNote('');
    setShowVocabModal(false);
    setActiveSidebarTab('vocabulary');
  };

  const handleUpdateWhiteboard = () => {
    const updatedMedia = {
      type: 'whiteboard' as const,
      whiteboardText: whiteboardInput,
    };
    getSocket().emit('media:update', {
      roomId: room.id,
      media: updatedMedia,
    });
    setSharedMedia(updatedMedia);
  };

  const handleUpdateTopic = () => {
    if (!customTopic.trim()) return;
    const updatedMedia = {
      type: 'topic' as const,
      topicPrompt: customTopic.trim(),
    };
    getSocket().emit('media:update', {
      roomId: room.id,
      media: updatedMedia,
    });
    setSharedMedia(updatedMedia);
  };

  const handleSaveFlashcard = (id: string) => {
    setSavedFlashcards((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const correctionsList = chatMessages.filter(
    (m) => m.type === 'correction' || m.type === 'vocab'
  );

  return (
    <aside className="w-80 md:w-96 h-full bg-[#121222] border-l border-white/5 flex flex-col shrink-0">
      {/* Top Tabs Bar */}
      <div className="p-2 border-b border-white/5 flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSidebarTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSidebarTab === 'chat'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('vocabulary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSidebarTab === 'vocabulary'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vocab</span>
            {correctionsList.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center justify-center">
                {correctionsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSidebarTab('media')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSidebarTab === 'media'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('participants')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSidebarTab === 'participants'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peers</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab 1: Live Chat */}
      {activeSidebarTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">No messages yet in this room.</p>
                <p className="text-[11px] text-white/30 mt-1">
                  Type vocabulary, phrase questions, or say hello!
                </p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isSelf = msg.senderId === currentUser?.uid;

                if (msg.type === 'correction') {
                  return (
                    <div
                      key={msg.id}
                      className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Language Correction
                        </span>
                        <span className="text-[10px] text-white/40">{msg.senderName}</span>
                      </div>
                      <div className="text-rose-300/80 line-through">
                        {msg.original}
                      </div>
                      <div className="text-emerald-300 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        {msg.correction}
                      </div>
                      {msg.note && (
                        <div className="text-[11px] text-white/70 italic bg-black/20 p-1.5 rounded-lg">
                          💡 {msg.note}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      isSelf ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar src={msg.senderAvatar} name={msg.senderName} size="xs" />
                    <div
                      className={`max-w-[75%] rounded-2xl p-2.5 text-xs ${
                        isSelf
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                      }`}
                    >
                      <div className="text-[10px] opacity-60 font-medium mb-0.5">
                        {msg.senderName}
                      </div>
                      <p className="leading-relaxed break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Reaction Bar */}
          <div className="px-3 py-1 border-t border-white/5 flex items-center justify-around bg-black/20">
            {['👋', '👏', '🎯', '💡', '❤️', '🔥'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  getSocket().emit('chat:message', {
                    roomId: room.id,
                    text: emoji,
                    type: 'chat',
                  });
                }}
                className="hover:scale-125 transition-transform text-sm p-1"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={() => setShowVocabModal(true)}
              className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition"
              title="Add Vocabulary / Correction"
            >
              <Plus className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Send message or idiom..."
              className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={!messageText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Vocabulary & Corrections */}
      {activeSidebarTab === 'vocabulary' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Corrections & Idioms ({correctionsList.length})
            </span>
            <button
              onClick={() => setShowVocabModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition"
            >
              <Plus className="w-3 h-3" />
              Add Correction
            </button>
          </div>

          {correctionsList.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center text-white/40">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p className="text-xs font-medium">No language corrections posted yet.</p>
              <p className="text-[11px] text-white/30 mt-1">
                Help fellow speakers by noting grammar adjustments, natural collocations, or pronunciation tips.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {correctionsList.map((item) => {
                const isBookmarked = savedFlashcards.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[#181a30] border border-white/10 space-y-2 relative group"
                  >
                    <button
                      onClick={() => handleSaveFlashcard(item.id)}
                      className={`absolute top-3 right-3 p-1 rounded-lg transition ${
                        isBookmarked
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'text-white/30 hover:text-white'
                      }`}
                      title={isBookmarked ? 'Saved to flashcards' : 'Save to my flashcards'}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <div className="pr-6">
                      <span className="text-[10px] text-rose-300/80 line-through block font-medium">
                        "{item.original}"
                      </span>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        "{item.correction}"
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-[11px] text-white/70 italic bg-black/30 p-2 rounded-xl">
                        💡 {item.note}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                      <span>By {item.senderName}</span>
                      <span>
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Collaborative Notes & Prompts */}
      {activeSidebarTab === 'media' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Conversation Prompt Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border border-indigo-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                Live Conversation Prompt
              </span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed italic">
              "{room.sharedMedia?.topicPrompt || 'What is a cultural tradition in your country that outsiders usually find surprising?'}"
            </p>

            {isHost && (
              <div className="mt-3 pt-3 border-t border-indigo-500/20">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Set new speaking topic prompt..."
                  className="w-full text-xs p-2 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none mb-2"
                />
                <button
                  onClick={handleUpdateTopic}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition"
                >
                  Broadcast New Topic to Room
                </button>
              </div>
            )}
          </div>

          {/* Collaborative Whiteboard / Shared Vocab Notes */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white/80 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Shared Vocabulary Scratchpad
            </span>
            <textarea
              value={whiteboardInput}
              onChange={(e) => setWhiteboardInput(e.target.value)}
              placeholder="Shared notes, links, or phrases for the room..."
              rows={8}
              className="w-full text-xs p-3 rounded-2xl bg-black/30 border border-white/10 text-white/90 placeholder-white/30 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleUpdateWhiteboard}
              className="w-full py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition border border-white/5"
            >
              Sync Scratchpad with Room
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Participants & Moderation */}
      {activeSidebarTab === 'participants' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Host Moderation Banner */}
          {isHost && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
                <Crown className="w-4 h-4 text-amber-400" />
                You are the Room Host
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed mb-2">
                You have full control to mute disruptive mics, kick misbehaving users, or lock the room.
              </p>
              <button
                onClick={() => getSocket().emit('mod:lock-toggle', { roomId: room.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
              >
                {room.isPublic ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Lock Room (Private)
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" /> Unlock Room (Public)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Speakers List */}
          <div>
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
              Speakers ({room.participants?.length || 0} / {room.maxParticipants})
            </span>

            <div className="space-y-2">
              {room.participants?.map((p) => (
                <div
                  key={p.uid || p.socketId}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                >
                  <div
                    onClick={() =>
                      onOpenProfile({
                        uid: p.uid,
                        displayName: p.displayName,
                        photoURL: p.photoURL,
                        isVerified: p.isVerified || false,
                        vouchCount: 0,
                        vouchedBy: [],
                        nativeLanguages: ['English'],
                        learningLanguages: ['Spanish'],
                        followers: [],
                        following: [],
                        createdAt: Date.now(),
                        email: '',
                      })
                    }
                    className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                  >
                    <Avatar
                      src={p.photoURL}
                      name={p.displayName}
                      size="sm"
                      isSpeaking={p.isSpeaking && !p.isMuted}
                      isMuted={p.isMuted}
                      isVerified={p.isVerified}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {p.displayName}
                        </span>
                        {p.isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-white/40 block">
                        {p.isMuted ? 'Muted' : p.isSpeaking ? 'Speaking' : 'Idle'}
                      </span>
                    </div>
                  </div>

                  {isHost && p.uid !== currentUser?.uid && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          getSocket().emit('mod:mute-peer', {
                            targetUid: p.uid,
                            roomId: room.id,
                          })
                        }
                        className="p-1 rounded-lg bg-white/5 hover:bg-amber-500/20 text-white/60 hover:text-amber-300"
                        title="Force Mute"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          getSocket().emit('mod:kick', {
                            targetUid: p.uid,
                            roomId: room.id,
                          })
                        }
                        className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400"
                        title="Kick from room"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Listeners List */}
          {room.allowListeners && (room.listeners?.length || 0) > 0 && (
            <div>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block mb-2">
                Listeners ({room.listeners.length})
              </span>
              <div className="space-y-1.5">
                {room.listeners.map((l) => (
                  <div
                    key={l.uid || l.socketId}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar src={l.photoURL} name={l.displayName} size="xs" />
                      <span className="text-xs text-white/80">{l.displayName}</span>
                    </div>
                    <span className="text-[10px] text-white/40">Silent</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary Correction Modal */}
      {showVocabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#18182c] border border-white/10 p-5 shadow-2xl">
            <button
              onClick={() => setShowVocabModal(false)}
              className="absolute top-3 right-3 text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-sm font-bold text-white flex items-center gap-1.5 mb-3">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Add Vocabulary or Correction
            </h4>

            <form onSubmit={handleSendCorrection} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  Original (What the speaker said)
                </label>
                <input
                  type="text"
                  value={vocabOriginal}
                  onChange={(e) => setVocabOriginal(e.target.value)}
                  placeholder="e.g. He suggested me to go"
                  className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  Better / Native Phrasing
                </label>
                <input
                  type="text"
                  value={vocabCorrection}
                  onChange={(e) => setVocabCorrection(e.target.value)}
                  placeholder="e.g. He suggested that I go"
                  className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/70 mb-1">
                  Grammar / Usage Note (Optional)
                </label>
                <input
                  type="text"
                  value={vocabNote}
                  onChange={(e) => setVocabNote(e.target.value)}
                  placeholder="e.g. 'Suggest' takes a subjunctive clause, not an indirect object."
                  className="w-full text-xs p-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Post Correction to Room
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};
