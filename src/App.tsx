import { useEffect } from "react";
import { ChatInterface } from "./components/ChatInterface";
import { CodeViewer } from "./components/CodeViewer";
import { SettingsDialog } from "./components/SettingsDialog";
import { useAppState } from "./hooks/useAppState";
import { useGenerator } from "./hooks/useGenerator";
import { useIsMobile } from "./hooks/useIsMobile";
import { useConversationStore } from "./store/conversation";

export default function App() {
  const activeId = useConversationStore((s) => s.activeId);
  const hasHydrated = useConversationStore((s) => s._hasHydrated);
  const conversations = useConversationStore((s) => s.conversations);
  const createConversation = useConversationStore((s) => s.createConversation);
  const switchConversation = useConversationStore((s) => s.switchConversation);
  const isMobile = useIsMobile();

  // On hydration: ensure there's an active conversation
  useEffect(() => {
    if (!hasHydrated) return;
    if (!activeId || !conversations[activeId]) {
      const entries = Object.values(conversations);
      if (entries.length > 0) {
        const latest = entries.sort((a, b) => b.updatedAt - a.updatedAt)[0];
        switchConversation(latest.id);
      } else {
        createConversation();
      }
    }
  }, [hasHydrated]);

  const {
    files,
    setFiles,
    currentFile,
    setCurrentFile,
    messages,
    setMessages,
    isGenerating,
    setIsGenerating,
    settings,
    hasValidSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    handleSaveSettings,
    webSearchSettings,
    handleSaveWebSearchSettings,
    template,
    setTemplate,
    sandpackKey,
    restartSandpack,
    isProjectInitialized,
    setIsProjectInitialized,
  } = useAppState();

  const { generate, stop, updateFiles, deleteFile, renameFile, moveFile } = useGenerator({
    settings,
    webSearchSettings,
    files,
    setMessages,
    setFiles,
    setIsGenerating,
    setTemplate,
    restartSandpack,
    setIsProjectInitialized,
  });

  // Reset ephemeral state on conversation switch
  useEffect(() => {
    setCurrentFile("src/App.tsx");
    restartSandpack();
  }, [activeId]);

  if (!hasHydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <div className="w-full md:w-100 shrink-0 h-full">
        <ChatInterface
          messages={messages}
          isGenerating={isGenerating}
          hasValidSettings={hasValidSettings}
          onGenerate={generate}
          onStop={stop}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSetFiles={(f) => setFiles(f)}
          files={files}
          template={template}
          sandpackKey={sandpackKey}
          isProjectInitialized={isProjectInitialized}
        />
      </div>

      {isProjectInitialized && !isMobile ? (
        <div className="flex-1 h-full min-w-0">
          <CodeViewer
            files={files}
            currentFile={currentFile}
            onFileSelect={setCurrentFile}
            onFileChange={updateFiles}
            onRenameFile={renameFile}
            onDeleteFile={deleteFile}
            onMoveFile={moveFile}
            template={template}
            sandpackKey={sandpackKey}
          />
        </div>
      ) : (
        <div className="flex-1 h-full min-w-0 hidden md:flex items-center justify-center bg-muted/30">
          <div className="text-center max-w-md px-6">
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              开始构建你的项目
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              在左侧对话框中描述你想要创建的应用，AI 将为你生成完整的项目代码。
            </p>
          </div>
        </div>
      )}

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        webSearchSettings={webSearchSettings}
        onSaveWebSearch={handleSaveWebSearchSettings}
      />
    </div>
  );
}
