import { create } from 'zustand'

const useAtlasStore = create((set, get) => ({
  // ── Scene ─────────────────────────────────────────
  currentScene: 'entry',    // 'entry' | 'descent' | 'emergence' | 'chat'
  setScene: (scene) => set({ currentScene: scene }),

  // ── Crystal ───────────────────────────────────────
  crystalState: 'SEED',     // SEED | CHARGING | DESCENDING | FORMING | EMERGED
  setCrystalState: (s) => set({ crystalState: s }),

  // ── Pipeline ──────────────────────────────────────
  pipelineStage: null,      // null | 'gatherer' | 'synthesizer' | 'critic'
  setPipelineStage: (stage) => set({ pipelineStage: stage }),
  pipelineError: null,
  setPipelineError: (err) => set({ pipelineError: err }),

  // ── Input ─────────────────────────────────────────
  question: '',
  setQuestion: (q) => set({ question: q }),
  projectTag: 'default',
  setProjectTag: (tag) => set({ projectTag: tag }),
  deepResearch: false,
  setDeepResearch: (v) => set({ deepResearch: v }),

  // ── Results ───────────────────────────────────────
  synthesisId: null,
  processedInfo: null,
  flaggedItems: [],
  setResults: (id, info, flags) => set({
    synthesisId: id,
    processedInfo: info,
    flaggedItems: flags ?? []
  }),

  // ── Sources ───────────────────────────────────────
  sources: [],
  addSource: (source) => set((s) => ({
    sources: [...s.sources, source]
  })),
  updateSource: (id, patch) => set((s) => ({
    sources: s.sources.map(src => src.id === id ? { ...src, ...patch } : src)
  })),
  ghostSources: () => set((s) => ({
    sources: s.sources.map(src => ({ ...src, state: 'ghost' }))
  })),
  clearSources: () => set({ sources: [] }),

  // ── HUD live data ─────────────────────────────────
  activeSource: null,
  setActiveSource: (domain) => set({ activeSource: domain }),
  sourceCount: 0,
  incrementSourceCount: () => set((s) => ({ sourceCount: s.sourceCount + 1 })),
  findingCount: 0,
  setFindingCount: (n) => set({ findingCount: n }),
  flagCount: 0,
  incrementFlagCount: () => set((s) => ({ flagCount: s.flagCount + 1 })),

  // ── Data Shards ───────────────────────────────────
  dataShards: [],
  addShard: (shard) => set((s) => {
    const existing = s.dataShards
    const trimmed = existing.length >= 12
      ? existing.slice(1)   // remove oldest
      : existing
    return { dataShards: [...trimmed, shard] }
  }),
  updateShard: (id, updates) => set((s) => ({
    dataShards: s.dataShards.map(sh => sh.id === id ? { ...sh, ...updates } : sh)
  })),
  removeShard: (id) => set((s) => ({
    dataShards: s.dataShards.filter(sh => sh.id !== id)
  })),

  // ── Scan line ─────────────────────────────────────
  scanLineActive: false,
  scanLineY: 0,
  setScanLine: (active, y = 0) => set({ scanLineActive: active, scanLineY: y }),

  // ── VRAM ──────────────────────────────────────────
  vramSwapping: false,
  setVramSwapping: (v) => set({ vramSwapping: v }),

  // ── Chat ──────────────────────────────────────────
  chatMessages: [],
  addChatMessage: (msg) => set((s) => ({
    chatMessages: [...s.chatMessages, msg]
  })),
  clearChat: () => set({ chatMessages: [] }),

  // ── Reset ─────────────────────────────────────────
  resetPipeline: () => set({
    currentScene: 'entry',
    crystalState: 'SEED',
    pipelineStage: null,
    pipelineError: null,
    dataShards: [],
    scanLineActive: false,
    synthesisId: null,
    processedInfo: null,
    flaggedItems: [],
    sources: [],
    activeSource: null,
    sourceCount: 0,
    findingCount: 0,
    flagCount: 0,
    chatMessages: [],
  }),
}))

export default useAtlasStore
