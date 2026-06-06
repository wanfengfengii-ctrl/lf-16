import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Workstation,
  Craftsman,
  WorkstationStats,
  CraftsmanStats,
  Pipe,
  PipeStatus,
} from '../../types';
import { generateMockWorkstations, generateMockCraftsmen } from '../../utils/mockData';

interface CollaborationStoreState {
  workstations: Workstation[];
  craftsmen: Craftsman[];
  selectedWorkstationId: string | 'all';
  selectedCraftsmanId: string | 'all';
  showWorkstationPanel: boolean;
  currentCraftsmanId: string | null;
}

interface CollaborationStoreActions {
  addWorkstation: (name: string, color: string, description?: string) => void;
  removeWorkstation: (id: string) => { workstations: Workstation[]; pipes: Pipe[] };
  updateWorkstation: (id: string, updates: Partial<Workstation>) => void;
  setSelectedWorkstation: (id: string | 'all') => void;

  addCraftsman: (name: string, role?: string) => void;
  removeCraftsman: (id: string) => { craftsmen: Craftsman[]; pipes: Pipe[] };
  updateCraftsman: (id: string, updates: Partial<Craftsman>) => void;
  setSelectedCraftsman: (id: string | 'all') => void;
  setCurrentCraftsman: (id: string | null) => void;

  assignPipeToWorkstation: (pipeId: string, workstationId: string | undefined, pipes: Pipe[]) => Pipe[];
  assignPipeToCraftsman: (pipeId: string, craftsmanId: string | undefined, pipes: Pipe[]) => Pipe[];
  batchAssignToWorkstation: (pipeIds: string[], workstationId: string | undefined, pipes: Pipe[]) => Pipe[];
  batchAssignToCraftsman: (pipeIds: string[], craftsmanId: string | undefined, pipes: Pipe[]) => Pipe[];

  getWorkstationStats: (pipes: Pipe[], allowedCentsDeviation: number) => WorkstationStats[];
  getCraftsmanStats: (pipes: Pipe[]) => CraftsmanStats[];

  toggleWorkstationPanel: () => void;
  setShowWorkstationPanel: (show: boolean) => void;
}

export type CollaborationStore = CollaborationStoreState & CollaborationStoreActions;

export const useCollaborationStore = create<CollaborationStore>((set, get) => ({
  workstations: generateMockWorkstations(),
  craftsmen: generateMockCraftsmen(),
  selectedWorkstationId: 'all',
  selectedCraftsmanId: 'all',
  showWorkstationPanel: false,
  currentCraftsmanId: null,

  addWorkstation: (name, color, description) =>
    set((state) => {
      const newWorkstation: Workstation = {
        id: uuidv4(),
        name,
        color,
        description,
        createdAt: new Date().toISOString(),
      };
      return { workstations: [...state.workstations, newWorkstation] };
    }),

  removeWorkstation: (id) => {
    const workstations = get().workstations.filter((w) => w.id !== id);
    const selectedWorkstationId = get().selectedWorkstationId === id ? 'all' : get().selectedWorkstationId;
    set({ workstations, selectedWorkstationId });
    return {
      workstations,
      pipes: [] as Pipe[],
    };
  },

  updateWorkstation: (id, updates) =>
    set((state) => ({
      workstations: state.workstations.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  setSelectedWorkstation: (id) => set({ selectedWorkstationId: id }),

  addCraftsman: (name, role) =>
    set((state) => {
      const newCraftsman: Craftsman = {
        id: uuidv4(),
        name,
        role,
        createdAt: new Date().toISOString(),
      };
      return { craftsmen: [...state.craftsmen, newCraftsman] };
    }),

  removeCraftsman: (id) => {
    const craftsmen = get().craftsmen.filter((c) => c.id !== id);
    const selectedCraftsmanId = get().selectedCraftsmanId === id ? 'all' : get().selectedCraftsmanId;
    set({ craftsmen, selectedCraftsmanId });
    return {
      craftsmen,
      pipes: [] as Pipe[],
    };
  },

  updateCraftsman: (id, updates) =>
    set((state) => ({
      craftsmen: state.craftsmen.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setSelectedCraftsman: (id) => set({ selectedCraftsmanId: id }),

  setCurrentCraftsman: (id) => set({ currentCraftsmanId: id }),

  assignPipeToWorkstation: (pipeId, workstationId, pipes) =>
    pipes.map((p) =>
      p.id === pipeId ? { ...p, workstationId, updatedAt: new Date().toISOString() } : p
    ),

  assignPipeToCraftsman: (pipeId, craftsmanId, pipes) =>
    pipes.map((p) =>
      p.id === pipeId ? { ...p, assignedCraftsmanId: craftsmanId, updatedAt: new Date().toISOString() } : p
    ),

  batchAssignToWorkstation: (pipeIds, workstationId, pipes) =>
    pipes.map((p) =>
      pipeIds.includes(p.id) ? { ...p, workstationId, updatedAt: new Date().toISOString() } : p
    ),

  batchAssignToCraftsman: (pipeIds, craftsmanId, pipes) =>
    pipes.map((p) =>
      pipeIds.includes(p.id) ? { ...p, assignedCraftsmanId: craftsmanId, updatedAt: new Date().toISOString() } : p
    ),

  getWorkstationStats: (pipes, allowedCentsDeviation) => {
    const { workstations } = get();
    const stats: WorkstationStats[] = [];

    const unassignedPipes = pipes.filter((p) => !p.workstationId);
    const unassignedDeviations = unassignedPipes
      .filter((p) => p.centsDeviation !== undefined)
      .map((p) => Math.abs(p.centsDeviation!));

    stats.push({
      workstationId: 'unassigned',
      workstationName: '未分配',
      totalPipes: unassignedPipes.length,
      verifiedPipes: unassignedPipes.filter((p) => p.status === 'verified').length,
      tuningPipes: unassignedPipes.filter((p) => p.status === 'tuning').length,
      needsReviewPipes: unassignedPipes.filter((p) => p.status === 'needs-review').length,
      pendingRetestPipes: unassignedPipes.filter((p) => p.status === 'pending-retest').length,
      avgDeviation: unassignedDeviations.length > 0 ? unassignedDeviations.reduce((a, b) => a + b, 0) / unassignedDeviations.length : 0,
    });

    for (const ws of workstations) {
      const wsPipes = pipes.filter((p) => p.workstationId === ws.id);
      const deviations = wsPipes
        .filter((p) => p.centsDeviation !== undefined)
        .map((p) => Math.abs(p.centsDeviation!));

      stats.push({
        workstationId: ws.id,
        workstationName: ws.name,
        totalPipes: wsPipes.length,
        verifiedPipes: wsPipes.filter((p) => p.status === 'verified').length,
        tuningPipes: wsPipes.filter((p) => p.status === 'tuning').length,
        needsReviewPipes: wsPipes.filter((p) => p.status === 'needs-review').length,
        pendingRetestPipes: wsPipes.filter((p) => p.status === 'pending-retest').length,
        avgDeviation: deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0,
      });
    }

    return stats;
  },

  getCraftsmanStats: (pipes) => {
    const { craftsmen } = get();
    const stats: CraftsmanStats[] = [];

    for (const craftsman of craftsmen) {
      const cPipes = pipes.filter((p) => p.assignedCraftsmanId === craftsman.id);
      const completedTasks = cPipes.filter((p) => p.status === 'verified').length;
      const deviations = cPipes
        .filter((p) => p.centsDeviation !== undefined)
        .map((p) => Math.abs(p.centsDeviation!));

      stats.push({
        craftsmanId: craftsman.id,
        craftsmanName: craftsman.name,
        completedTasks,
        totalPipesTuned: cPipes.length,
        avgDeviation: deviations.length > 0 ? deviations.reduce((a, b) => a + b, 0) / deviations.length : 0,
      });
    }

    return stats;
  },

  toggleWorkstationPanel: () =>
    set((state) => ({ showWorkstationPanel: !state.showWorkstationPanel })),

  setShowWorkstationPanel: (show) => set({ showWorkstationPanel: show }),
}));
