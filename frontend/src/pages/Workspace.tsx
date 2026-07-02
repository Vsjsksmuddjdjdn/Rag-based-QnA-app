import { useEffect, useState } from "react";
import { AlertTriangle, PanelRightOpen } from "lucide-react";
import { ChatPanel } from "../components/ChatPanel";
import { CitationDrawer } from "../components/CitationDrawer";
import { CollectionSidebar } from "../components/CollectionSidebar";
import { DocumentPanel } from "../components/DocumentPanel";
import { SettingsPanel } from "../components/SettingsPanel";
import { ThemeToggle } from "../components/ThemeToggle";
import { api } from "../lib/api";
import { useChat } from "../hooks/useChat";
import { useCollections } from "../hooks/useCollections";
import { useDocuments } from "../hooks/useDocuments";
import { useTheme } from "../hooks/useTheme";
import type { ChatMessage } from "../types";

export function Workspace() {
  const { theme, toggleTheme } = useTheme();
  const collections = useCollections();
  const documents = useDocuments(collections.selectedCollectionId, collections.refresh);
  const chat = useChat(collections.selectedCollectionId);
  const [vectorWarning, setVectorWarning] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(true);

  useEffect(() => {
    api
      .health()
      .then((health) => {
        setVectorWarning(health.vector.ok ? "" : health.vector.message || "Vector database is not reachable.");
      })
      .catch(() => setVectorWarning("Backend health check failed. Confirm the API server is running."));
  }, []);

  const selectAssistantMessage = (message: ChatMessage) => {
    chat.setActiveCitations(message.citations ?? []);
    setDrawerOpen(true);
  };

  return (
    <div className="h-screen overflow-hidden bg-stone-100 text-zinc-950 dark:bg-zinc-950 dark:text-white">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <CollectionSidebar
          collections={collections.collections}
          selectedCollectionId={collections.selectedCollectionId}
          loading={collections.loading}
          error={collections.error}
          onSelect={collections.setSelectedCollectionId}
          onCreate={collections.createCollection}
        />

        <main className="flex min-h-0 flex-col">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white/85 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                Retrieval-Augmented Generation
              </p>
              <h1 className="truncate text-lg font-bold text-zinc-950 dark:text-white">
                {collections.selectedCollection?.name || "Create a collection"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="icon-button lg:hidden"
                onClick={() => setDrawerOpen((current) => !current)}
                title="Toggle sources"
                aria-label="Toggle sources"
              >
                <PanelRightOpen className="h-5 w-5" />
              </button>
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </header>

          {vectorWarning ? (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="h-4 w-4" />
              {vectorWarning}
            </div>
          ) : null}

          <div className="grid min-h-0 flex-1 gap-4 p-4 xl:grid-cols-[340px_minmax(0,1fr)_360px]">
            <div className="min-h-0 space-y-4">
              <DocumentPanel
                documents={documents.documents}
                loading={documents.loading}
                disabled={!collections.selectedCollectionId}
                uploadProgress={documents.uploadProgress}
                uploadResults={documents.uploadResults}
                error={documents.error}
                onUpload={documents.upload}
                onDelete={documents.remove}
                onReindex={documents.reindex}
              />
              <SettingsPanel settings={chat.settings} onChange={chat.setSettings} />
            </div>

            <ChatPanel
              collectionName={collections.selectedCollection?.name}
              messages={chat.messages}
              loading={chat.loading}
              error={chat.error}
              disabled={!collections.selectedCollectionId}
              onAsk={chat.ask}
              onClear={chat.clearHistory}
              onSelectCitations={selectAssistantMessage}
            />

            <div className={drawerOpen ? "min-h-0 xl:block" : "hidden xl:block min-h-0"}>
              <CitationDrawer
                citations={chat.activeCitations}
                context={chat.activeContext}
                showContext={chat.settings.showContext}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
