import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  item_id: string;
  other_user_id: string;
  other_user_name: string;
  item_title: string;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<{ itemId: string; otherId: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeItemTitle, setActiveItemTitle] = useState("");
  const [otherName, setOtherName] = useState("");
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" }), 50);
  }, []);

  // Initialize from URL
  useEffect(() => {
    const itemId = searchParams.get("item");
    const sellerId = searchParams.get("seller");
    if (itemId && sellerId && user && sellerId !== user.id) {
      setActiveConv({ itemId, otherId: sellerId });
    }
  }, [searchParams, user]);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: msgs } = await supabase
      .from("messages")
      .select("item_id, sender_id, receiver_id, content, created_at, read")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!msgs) return;

    const convMap = new Map<string, any>();
    for (const msg of msgs) {
      const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      const key = `${msg.item_id}::${otherId}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          item_id: msg.item_id, other_user_id: otherId,
          last_message: msg.content, last_time: msg.created_at,
          unread: !msg.read && msg.receiver_id === user.id ? 1 : 0,
        });
      } else if (!msg.read && msg.receiver_id === user.id) {
        convMap.get(key).unread += 1;
      }
    }

    const uniqueUserIds = [...new Set([...convMap.values()].map((c) => c.other_user_id))];
    const uniqueItemIds = [...new Set([...convMap.values()].map((c) => c.item_id))];

    const [{ data: profiles }, { data: items }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", uniqueUserIds),
      supabase.from("items").select("id, title").in("id", uniqueItemIds),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));
    const itemMap = new Map((items || []).map((i) => [i.id, i.title]));

    const convs: Conversation[] = [...convMap.values()].map((c) => ({
      ...c,
      other_user_name: profileMap.get(c.other_user_id) || "User",
      item_title: itemMap.get(c.item_id) || "Item",
    }));
    setConversations(convs);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages for active conversation + realtime
  const loadMessages = useCallback(async () => {
    if (!activeConv || !user) return;
    setLoadingMsgs(true);

    const [{ data }, { data: profile }, { data: item }] = await Promise.all([
      supabase.from("messages")
        .select("id, content, sender_id, created_at")
        .eq("item_id", activeConv.itemId)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeConv.otherId}),and(sender_id.eq.${activeConv.otherId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("full_name").eq("user_id", activeConv.otherId).single(),
      supabase.from("items").select("title").eq("id", activeConv.itemId).single(),
    ]);

    setMessages(data || []);
    setOtherName(profile?.full_name || "User");
    setActiveItemTitle(item?.title || "Item");
    setLoadingMsgs(false);
    scrollToBottom(false);

    // Mark as read
    supabase.from("messages")
      .update({ read: true })
      .eq("item_id", activeConv.itemId)
      .eq("sender_id", activeConv.otherId)
      .eq("receiver_id", user.id)
      .then(() => loadConversations());
  }, [activeConv, user, scrollToBottom, loadConversations]);

  useEffect(() => {
    if (!activeConv || !user) return;
    loadMessages();

    const channel = supabase
      .channel(`chat:${activeConv.itemId}:${activeConv.otherId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `item_id=eq.${activeConv.itemId}`,
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.sender_id === activeConv.otherId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          scrollToBottom();
        }
      })
      .subscribe();

    inputRef.current?.focus();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || !activeConv || !user) return;
    setNewMessage("");

    await supabase.from("messages").insert({
      item_id: activeConv.itemId,
      sender_id: user.id,
      receiver_id: activeConv.otherId,
      content,
    });
  };

  return (
    <div className="container py-8 page-enter">
      <h1 className="font-display text-3xl font-bold mb-6">Messages</h1>

      <div className="grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <div className={`flex flex-col rounded-2xl border bg-card overflow-hidden ${activeConv ? "hidden md:flex" : "flex"}`}>
          <div className="px-4 py-3 border-b bg-muted/30">
            <p className="text-sm font-semibold text-muted-foreground">Conversations</p>
          </div>
          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Find an item and start chatting!</p>
              </div>
            ) : (
              <div>
                {conversations.map((conv) => {
                  const isActive = activeConv?.itemId === conv.item_id && activeConv?.otherId === conv.other_user_id;
                  return (
                    <button
                      key={`${conv.item_id}-${conv.other_user_id}`}
                      onClick={() => setActiveConv({ itemId: conv.item_id, otherId: conv.other_user_id })}
                      className={`w-full text-left px-4 py-3.5 border-b last:border-0 transition-colors hover:bg-muted/50 ${isActive ? "bg-primary/8 border-l-2 border-l-primary" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-semibold text-sm truncate">{conv.other_user_name}</p>
                        {conv.unread > 0 && (
                          <span className="ml-2 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.item_title}</p>
                      <p className="text-xs text-muted-foreground/70 truncate mt-1">{conv.last_message}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className={`flex flex-col rounded-2xl border bg-card overflow-hidden ${!activeConv ? "hidden md:flex" : "flex"}`}>
          {activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 border-b px-4 py-3.5 bg-muted/30">
                <Button variant="ghost" size="icon-sm" className="md:hidden shrink-0" onClick={() => setActiveConv(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{otherName}</p>
                  <p className="text-xs text-muted-foreground truncate">Re: {activeItemTitle}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()} className="rounded-xl shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <MessageSquare className="h-14 w-14 mb-4 opacity-20" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm mt-1">Choose a chat from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
