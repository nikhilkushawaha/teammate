import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import { useSocket } from "@/hooks/use-socket";
import useChatMessages from "@/hooks/api/use-chat-messages";
import { ChatMessageType } from "@/types/api.type";
import { useQueryClient } from "@tanstack/react-query";
import { Socket } from "socket.io-client";

interface ChatWindowProps {
  workspaceId: string;
}

export default function ChatWindow({ workspaceId }: ChatWindowProps) {
  const { socket, isConnected } = useSocket(workspaceId);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const {
    data: messagesData,
    isLoading,
    refetch,
  } = useChatMessages(workspaceId, 1, 100);

  // Initialize messages from API
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Socket event listeners - set up even if not connected yet
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { chatMessage: ChatMessageType }) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((msg) => msg._id === data.chatMessage._id)) {
          return prev;
        }
        return [...prev, data.chatMessage];
      });
      // Also invalidate query to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", workspaceId],
      });
    };

    const handleUserTyping = (data: { userId: string; userName: string }) => {
      setTypingUsers((prev) => new Set(prev).add(data.userName));
    };

    const handleUserStoppedTyping = (data: { userId: string; userName?: string }) => {
      if (data.userName) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userName!);
          return newSet;
        });
      }
    };

    const handleError = (error: { message: string; errorCode?: string }) => {
      // Error handled silently for production
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("error", handleError);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("error", handleError);
    };
  }, [socket, workspaceId, queryClient]);

  // Clear typing indicators after 3 seconds
  useEffect(() => {
    if (typingUsers.size > 0) {
      const timer = setTimeout(() => {
        setTypingUsers(new Set());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [typingUsers]);

  const handleTypingStart = () => {
    // Typing indicator is handled in MessageInput
  };

  const handleTypingStop = () => {
    // Typing indicator is handled in MessageInput
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
      <div className="border-b p-4">
        <h2 className="text-lg font-semibold">Workspace Chat</h2>
        {!isConnected && (
          <p className="text-sm text-muted-foreground">Connecting...</p>
        )}
        {typingUsers.size > 0 && (
          <p className="text-sm text-muted-foreground">
            {Array.from(typingUsers).join(", ")} typing...
          </p>
        )}
      </div>

      <MessageList messages={messages} isLoading={isLoading} />

      <MessageInput
        workspaceId={workspaceId}
        socket={socket}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
      />
    </Card>
  );
}

