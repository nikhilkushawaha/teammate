import { useQuery } from "@tanstack/react-query";
import { getChatMessagesQueryFn } from "@/lib/api";

const useChatMessages = (
  workspaceId: string,
  pageNumber: number = 1,
  pageSize: number = 50
) => {
  const query = useQuery({
    queryKey: ["chat-messages", workspaceId, pageNumber, pageSize],
    queryFn: () => getChatMessagesQueryFn(workspaceId, pageNumber, pageSize),
    enabled: !!workspaceId,
    staleTime: 0, // Always fetch fresh messages
  });

  return query;
};

export default useChatMessages;

