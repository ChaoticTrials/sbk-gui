import { useState } from "react";
import { Toolbar } from "@/components/Toolbar/Toolbar";
import { SearchBar } from "@/components/SearchBar/SearchBar";
import { CoordinateSearch } from "@/components/CoordinateSearch/CoordinateSearch";
import { FileTable } from "@/components/FileTable/FileTable";
import { StatusBar } from "@/components/StatusBar/StatusBar";
import { ContextMenu } from "@/components/ContextMenu/ContextMenu";
import { ExtractDialog } from "@/components/ExtractDialog/ExtractDialog";
import { PropertiesDialog } from "@/components/PropertiesDialog/PropertiesDialog";
import { ErrorToast } from "@/components/ErrorToast/ErrorToast";
import { VerifyDialog } from "@/components/VerifyDialog/VerifyDialog";
import { useUiStore } from "@/store/useUiStore";
import { useKeyboard } from "@/hooks/useKeyboard";
import styles from "./ArchiveView.module.css";

export function ArchiveView() {
  const searchActive = useUiStore((s) => s.searchActive);
  const extractDialog = useUiStore((s) => s.extractDialog);
  const propertiesEntry = useUiStore((s) => s.propertiesEntry);
  const verifyDialogOpen = useUiStore((s) => s.verifyDialogOpen);
  const [coordSearchOpen, setCoordSearchOpen] = useState(false);
  useKeyboard();

  return (
    <div className={styles.root}>
      <Toolbar coordSearchOpen={coordSearchOpen} onToggleCoordSearch={() => setCoordSearchOpen((v) => !v)} />
      {coordSearchOpen && <CoordinateSearch onClose={() => setCoordSearchOpen(false)} />}
      {searchActive && <SearchBar />}
      <FileTable />
      <StatusBar />
      <ContextMenu />
      {extractDialog && <ExtractDialog />}
      {propertiesEntry && <PropertiesDialog />}
      {verifyDialogOpen && <VerifyDialog />}
      <ErrorToast />
    </div>
  );
}
