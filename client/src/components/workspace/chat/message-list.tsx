import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageType } from "@/types/api.type";
import { format } from "date-fns";
import { getAvatarColor, getAvatarFallbackText } from "@/lib/helper";
import { useAuthContext } from "@/context/auth-provider";
import { Loader } from "lucide-react";

interface MessageListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthContext();

  // Auto-scroll to bottom when messages change or component mounts
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame and setTimeout to ensure DOM is fully updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Try to find the viewport element (Radix ScrollArea structure)
          const scrollArea = scrollContainerRef.current?.closest('[data-radix-scroll-area-root]');
          const viewport = scrollArea?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
          
          if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
          } else if (messagesEndRef.current) {
            // Fallback: use scrollIntoView
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 50);
      });
    }
  }, [messages]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div ref={scrollContainerRef} className="space-y-4 min-h-full">
        {messages.map((message) => {
          const isOwnMessage = message.senderId._id === user?._id;
          const senderName = message.senderId.name || "Unknown";
          const senderAvatar = message.senderId.profilePicture;
          const avatarColor = getAvatarColor(senderName);

          return (
            <div
              key={message._id}
              className={`flex gap-3 ${
                isOwnMessage ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={senderAvatar || undefined} />
                <AvatarFallback
                  className="text-xs"
                  style={{ backgroundColor: avatarColor }}
                >
                  {getAvatarFallbackText(senderName)}
                </AvatarFallback>
              </Avatar>

              <div
                className={`flex flex-col max-w-[70%] ${
                  isOwnMessage ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {isOwnMessage ? "You" : senderName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), "HH:mm")}
                  </span>
                </div>
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

