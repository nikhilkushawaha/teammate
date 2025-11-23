import ChatWindow from "@/components/workspace/chat/chat-window";
import useWorkspaceId from "@/hooks/use-workspace-id";

export default function Chat() {
  const workspaceId = useWorkspaceId();

  return (
    <div className="container mx-auto p-6">
      <ChatWindow workspaceId={workspaceId} />
    </div>
  );
}

