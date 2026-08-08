import { useRef, useCallback } from 'react'
import useAtlasStore from '../store/atlasStore'

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

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

        case 'agent_completed':
          if (data?.agent === 'gatherer') {
            s.setFindingCount(data?.fact_count ?? 0)
          }
          break

        case 'synthesizer_started':
          s.setPipelineStage('synthesizer')
          s.ghostSources()
          break

        case 'critic_started':
          s.setPipelineStage('critic')
          break

        case 'gatherer_completed':
          // gatherer done, synthesizer next
          break

        case 'source_started': {
          const s = useAtlasStore.getState()
          const domain = extractDomain(data?.url ?? '')
          if (domain && s.sources.length < 7) {
            s.addSource({
              id: data?.url ?? domain,
              domain,
              state: 'fetching',
              slot: s.sources.length,
            })
          }
          s.setActiveSource(domain)
          if (!s.pipelineStage) {
            s.setPipelineStage('gatherer')
            s.setCrystalState('FORMING')
          }
          break
        }

        case 'source_generation_completed': {
          const s = useAtlasStore.getState()
          s.updateSource(data?.url ?? '', { state: 'complete' })
          s.incrementSourceCount()
          // Fallthrough to set stage if needed
        }

        case 'source_fetch_completed':
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

        case 'memory_written':
          if (data?.type === 'FLAGGED') {
            s.incrementFlagCount()
          } else if (data?.type === 'RAW_FINDING') {
            s.incrementSourceCount()  // repurpose as fact counter during gatherer
          }
          break

        case 'findings_retrieved':
          if (s.pipelineStage === 'synthesizer' || data?.retrieved_count) {
            s.setFindingCount(data?.retrieved_count ?? 0)
          }
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
            data?.output?.synthesis_id ?? null,
            data?.output?.processed_info ?? '',
            data?.output?.flagged_items ?? []
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
