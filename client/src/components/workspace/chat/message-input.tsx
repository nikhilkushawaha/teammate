import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile, Send } from "lucide-react";
import EmojiPickerComponent from "@/components/emoji-picker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createChatMessageMutationFn } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Socket } from "socket.io-client";

interface MessageInputProps {
  workspaceId: string;
  socket: Socket | null;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export default function MessageInput({
  workspaceId,
  socket,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createChatMessageMutationFn,
    onSuccess: () => {
      setMessage("");
      // Invalidate messages query to refetch
      queryClient.invalidateQueries({
        queryKey: ["chat-messages", workspaceId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim() || mutation.isPending) return;

    const messageText = message.trim();

    // Send via HTTP API (backend will emit socket event)
    mutation.mutate({
      workspaceId,
      message: messageText,
    });

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (socket && onTypingStop) {
      socket.emit("typing_stop", { workspaceId });
      onTypingStop();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage =
        message.substring(0, start) + emoji + message.substring(end);
      setMessage(newMessage);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Typing indicator logic
    if (!isTyping && socket && onTypingStart) {
      setIsTyping(true);
      socket.emit("typing_start", { workspaceId });
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && onTypingStop) {
        socket.emit("typing_stop", { workspaceId });
        onTypingStop();
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t p-4">
      <div className="flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <EmojiPickerComponent onSelectEmoji={handleEmojiSelect} />
          </PopoverContent>
        </Popover>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] max-h-[120px] resize-none"
          rows={1}
        />

        <Button
          onClick={handleSend}
          disabled={!message.trim() || mutation.isPending}
          size="icon"
          className="flex-shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

