import { useRef, useCallback } from 'react'
import useAtlasStore from '../store/atlasStore'

export function useWebSocket() {
  const wsRef = useRef(null)
  const store = useAtlasStore.getState

  const connect = useCallback((question, projectTag, deepResearch) => {
    if (wsRef.current) wsRef.current.close()

    const ws = new WebSocket('ws://localhost:8000/ws/research')
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        question,
        project_tag: projectTag,
        deep_research: deepResearch,
      }))
    }

    ws.onmessage = (event) => {
      let msg
      try { msg = JSON.parse(event.data) } catch { return }


      const s = useAtlasStore.getState()
      const { type, data } = msg

      switch (type) {
        // ── Pipeline stage changes ──────────────────────
        case 'agent_started':
        case 'pipeline_started':
          break  // handled by specific agent events below

        case 'synthesizer_started':
          s.setPipelineStage('synthesizer')
          break

        case 'critic_started':
          s.setPipelineStage('critic')
          break

        case 'gatherer_completed':
          // gatherer done, synthesizer next
          break

        case 'source_started':
        case 'source_fetch_completed':
        case 'source_generation_completed':
          // gatherer is running — set stage if not already set
          if (!s.pipelineStage) {
            s.setPipelineStage('gatherer')
            s.setCrystalState('FORMING')
          }
          break

        // ── Data shards ─────────────────────────────────
        case 'source_found':
        case 'raw_finding':
          s.addShard({
            id: data?.id ?? Math.random().toString(36).slice(2),
            url: data?.url ?? '',
            title: data?.title ?? '',
            state: 'FORMING',
            zone: s.pipelineStage ?? 'gatherer',
          })
          break

        case 'finding_verified':
          if (data?.id) s.updateShard(data.id, { state: 'SOLID' })
          break

        case 'finding_flagged':
          if (data?.id) s.updateShard(data.id, { state: 'FLAGGED' })
          break

        // ── Scan line ───────────────────────────────────
        case 'scan_start':
          s.setScanLine(true, data?.y ?? 0)
          break

        case 'scan_end':
          s.setScanLine(false, 0)
          break

        // ── Completion ──────────────────────────────────
        case 'pipeline_completed':
        case 'research_complete':
          s.setResults(
            data?.synthesis_id ?? null,
            data?.processed_info ?? data?.summary ?? '',
            data?.flagged ?? []
          )
          s.setCrystalState('EMERGED')
          s.setScene('emergence')
          break

        // ── Errors ──────────────────────────────────────
        case 'error':
          s.setPipelineError(data?.message ?? 'Unknown error')
          break

        default:
          break
      }
    }

    ws.onerror = (e) => {
      console.error('WebSocket error:', e)
      const s = useAtlasStore.getState()
      // Only set error if pipeline hasn't already completed successfully
      if (s.crystalState !== 'EMERGED') {
        s.setPipelineError('Connection failed')
      }
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  return { connect, disconnect }
}
