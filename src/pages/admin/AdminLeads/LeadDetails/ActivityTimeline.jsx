import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLeadActivity, postLeadComment } from '../../../../services/LeadPageApi';
import { Send, User, Info } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';

const ActivityTimeline = ({ leadId }) => {
    const [text, setText] = useState('');
    const queryClient = useQueryClient();
    const messagesEndRef = useRef(null);
    const { admin } = useAuth();

    // 1. Fetch Timeline
    const { data: activities = [], isLoading, isError } = useQuery({
        queryKey: ['lead-activity', leadId],
        queryFn: () => getLeadActivity(leadId),
        enabled: !!leadId, // Only fetch if leadId exists
        retry: 1, // Only retry once on error
        //refetchInterval: 5000, // Keep simple - 5 seconds
        refetchIntervalInBackground: false, // Don't refetch when tab is not active
        refetchOnWindowFocus: false, // Don't refetch when switching tabs
        onError: (error) => {
            console.warn('Activity fetch failed:', error.message);
        }
    });

    // 2. Post Comment Mutation
    const mutation = useMutation({
        mutationFn: (content) => postLeadComment(leadId, content),
        onSuccess: () => {

            setText('');

        }
    });

    // 3. Auto-scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activities]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        mutation.mutate(text);
    };

    const getAuthorName = (item) => {
        return item.authorName || 'System';
    };

    const getAuthorAvatar = (item) => {
        const name = item.authorName || 'System';
        const image = item.authorImage;

        if (image) {
            return (
                <img
                    src={image}
                    alt={name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                />
            );
        }

        return (
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                {name?.charAt(0)?.toUpperCase() || <User size={12} />}
            </div>
        );
    };

    if (isLoading) {
        return <div className="p-4 text-center text-gray-400 text-sm">Loading history...</div>;
    }

    if (isError) {
        return (
            <div className="p-4 text-center text-red-400 text-sm">
                Unable to load activity. This lead may have been deleted.
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header - Compact */}
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                    <Info size={16} /> Activity & Comments
                </h3>
            </div>

            {/* Timeline List - Scrollable, takes all available space */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {activities.map((item) => {
                    const currentUserId = admin?.workerProfile?._id || admin?._id || admin?.id;
                    const isMe = item.authorId === currentUserId?.toString();
                    const isSystem = item.type !== 'comment';
                    const authorName = getAuthorName(item);

                    if (isSystem) {
                        // SYSTEM MESSAGE (Gray center) - Compact
                        return (
                            <div key={item._id} className="flex justify-center my-2">
                                <div className="bg-gray-100 text-gray-500 text-xs py-1 px-2.5 rounded-full flex items-center gap-2 max-w-[90%]">
                                    <span className="font-medium">{authorName}:</span>
                                    <span className="truncate">{item.content}</span>
                                    <span className="opacity-50 shrink-0">| {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    }

                    // USER COMMENT (Chat Bubble) - Compact
                    return (
                        <div key={item._id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                            {getAuthorAvatar(item)}
                            <div className={`max-w-[80%] p-2.5 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                }`}>
                                <div className="font-bold text-[11px] mb-0.5 opacity-90">
                                    {authorName}
                                </div>
                                <div className="break-words">{item.content}</div>
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                    {new Date(item.createdAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Compact, fixed at bottom */}
            <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-gray-100 flex gap-2 shrink-0 bg-white">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a note..."
                    className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!text.trim() || mutation.isPending}
                    className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default ActivityTimeline;