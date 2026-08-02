export const WS_EVENTS = {
  // Pipeline
  PIPELINE_STARTED:    'pipeline_started',
  PIPELINE_COMPLETED:  'pipeline_completed',
  PIPELINE_STOPPED:    'pipeline_stopped',
  PIPELINE_ERROR:      'pipeline_error',

  // Agents
  AGENT_STARTED:       'agent_started',
  AGENT_COMPLETED:     'agent_completed',

  // Gatherer
  SEARCH_STARTED:               'search_started',
  SEARCH_COMPLETED:             'search_completed',
  SOURCE_STARTED:               'source_started',
  SOURCE_FETCH_COMPLETED:       'source_fetch_completed',
  SOURCE_GENERATION_COMPLETED:  'source_generation_completed',
  SOURCE_REPLACED:              'source_replaced',
  SOURCE_EXHAUSTED:             'source_exhausted',
  GATHERER_COMPLETED:           'gatherer_completed',

  // Synthesizer
  SYNTHESIZER_STARTED:              'synthesizer_started',
  SYNTHESIZER_SKIPPED:              'synthesizer_skipped',
  SYNTHESIZER_COMPLETED:            'synthesizer_completed',
  FINDINGS_RETRIEVED:               'findings_retrieved',
  SYNTHESIZER_GENERATION_COMPLETED: 'synthesizer_generation_completed',
  SYNTHESIS_SUPERSEDED:             'synthesis_superseded',

  // Critic
  CRITIC_STARTED:              'critic_started',
  CRITIC_SKIPPED:              'critic_skipped',
  CRITIC_COMPLETED:            'critic_completed',
  CRITIC_GENERATION_COMPLETED: 'critic_generation_completed',

  // Memory
  MEMORY_WRITTEN: 'memory_written',

  // VRAM
  MODEL_UNLOAD_STARTED:    'model_unload_started',
  MODEL_UNLOAD_COMPLETED:  'model_unload_completed',
  MODEL_LOAD_STARTED:      'model_load_started',
  MODEL_LOAD_COMPLETED:    'model_load_completed',
}
