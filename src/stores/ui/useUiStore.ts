import { create } from 'zustand';

interface UiStoreState {
  projectName: string;
  showPitchDetectionPanel: boolean;
  showWarningPanel: boolean;
  showTaskPanel: boolean;
  showWorkstationPanel: boolean;
  showConflictDesk: boolean;
}

interface UiStoreActions {
  setProjectName: (name: string) => void;

  togglePitchDetectionPanel: () => void;
  toggleWarningPanel: () => void;
  toggleTaskPanel: () => void;
  toggleWorkstationPanel: () => void;
  toggleConflictDesk: () => void;

  setShowPitchDetectionPanel: (show: boolean) => void;
  setShowWarningPanel: (show: boolean) => void;
  setShowTaskPanel: (show: boolean) => void;
  setShowWorkstationPanel: (show: boolean) => void;
  setShowConflictDesk: (show: boolean) => void;
}

export type UiStore = UiStoreState & UiStoreActions;

export const useUiStore = create<UiStore>((set) => ({
  projectName: '未命名工程',
  showPitchDetectionPanel: false,
  showWarningPanel: false,
  showTaskPanel: false,
  showWorkstationPanel: false,
  showConflictDesk: false,

  setProjectName: (name) => set({ projectName: name }),

  togglePitchDetectionPanel: () =>
    set((state) => ({ showPitchDetectionPanel: !state.showPitchDetectionPanel })),

  toggleWarningPanel: () =>
    set((state) => ({ showWarningPanel: !state.showWarningPanel })),

  toggleTaskPanel: () =>
    set((state) => ({ showTaskPanel: !state.showTaskPanel })),

  toggleWorkstationPanel: () =>
    set((state) => ({ showWorkstationPanel: !state.showWorkstationPanel })),

  toggleConflictDesk: () =>
    set((state) => ({ showConflictDesk: !state.showConflictDesk })),

  setShowPitchDetectionPanel: (show) => set({ showPitchDetectionPanel: show }),
  setShowWarningPanel: (show) => set({ showWarningPanel: show }),
  setShowTaskPanel: (show) => set({ showTaskPanel: show }),
  setShowWorkstationPanel: (show) => set({ showWorkstationPanel: show }),
  setShowConflictDesk: (show) => set({ showConflictDesk: show }),
}));
