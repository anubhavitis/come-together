import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Phase2 } from '@/types/journey'

function mapPhase2(row: Record<string, unknown>): Phase2 {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    completedAt: row.completed_at as string | null,
    rawImpressions: row.raw_impressions as Phase2['rawImpressions'],
    meq30: row.meq30 as Phase2['meq30'],
    edi: row.edi as Phase2['edi'],
    ebi: row.ebi as Phase2['ebi'],
    challenging: row.challenging as Phase2['challenging'],
    intentionRevisited: row.intention_revisited as Phase2['intentionRevisited'],
    updatedAt: row.updated_at as string,
  }
}

function toSnake(data: Partial<Phase2>): Record<string, unknown> {
  const map: Record<string, string> = {
    journeyId: 'journey_id',
    completedAt: 'completed_at',
    rawImpressions: 'raw_impressions',
    intentionRevisited: 'intention_revisited',
    updatedAt: 'updated_at',
  }
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue
    result[map[key] ?? key] = value
  }
  return result
}

export function usePhase2(journeyId: string) {
  return useQuery({
    queryKey: ['phase2', journeyId],
    enabled: !!journeyId,
    queryFn: async (): Promise<Phase2 | null> => {
      const { data, error } = await supabase
        .from('phase2')
        .select('*')
        .eq('journey_id', journeyId)
        .maybeSingle()

      if (error) throw error
      return data ? mapPhase2(data) : null
    },
  })
}

export function useUpsertPhase2() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<Phase2> & { journeyId: string }): Promise<Phase2> => {
      const { journeyId, ...rest } = input
      const row = toSnake({ ...rest, journeyId })

      const { data, error } = await supabase
        .from('phase2')
        .upsert(row, { onConflict: 'journey_id' })
        .select()
        .single()

      if (error) throw error
      return mapPhase2(data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phase2', variables.journeyId] })
      queryClient.invalidateQueries({ queryKey: ['journey', variables.journeyId] })
    },
  })
}
