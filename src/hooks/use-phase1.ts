import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Phase1 } from '@/types/journey'

function mapPhase1(row: Record<string, unknown>): Phase1 {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    completedAt: row.completed_at as string | null,
    swemwbs: row.swemwbs as Phase1['swemwbs'],
    innerLandscapeText: row.inner_landscape_text as Phase1['innerLandscapeText'],
    innerLandscapeRatings: row.inner_landscape_ratings as Phase1['innerLandscapeRatings'],
    intentions: row.intentions as Phase1['intentions'],
    context: row.context as Phase1['context'],
    updatedAt: row.updated_at as string,
  }
}

function toSnake(data: Partial<Phase1>): Record<string, unknown> {
  const map: Record<string, string> = {
    journeyId: 'journey_id',
    completedAt: 'completed_at',
    innerLandscapeText: 'inner_landscape_text',
    innerLandscapeRatings: 'inner_landscape_ratings',
    updatedAt: 'updated_at',
  }
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue
    result[map[key] ?? key] = value
  }
  return result
}

export function usePhase1(journeyId: string) {
  return useQuery({
    queryKey: ['phase1', journeyId],
    enabled: !!journeyId,
    queryFn: async (): Promise<Phase1 | null> => {
      const { data, error } = await supabase
        .from('phase1')
        .select('*')
        .eq('journey_id', journeyId)
        .maybeSingle()

      if (error) throw error
      return data ? mapPhase1(data) : null
    },
  })
}

export function useUpsertPhase1() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: Partial<Phase1> & { journeyId: string }): Promise<Phase1> => {
      const { journeyId, ...rest } = input
      const row = toSnake({ ...rest, journeyId })

      const { data, error } = await supabase
        .from('phase1')
        .upsert(row, { onConflict: 'journey_id' })
        .select()
        .single()

      if (error) throw error
      return mapPhase1(data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phase1', variables.journeyId] })
      queryClient.invalidateQueries({ queryKey: ['journey', variables.journeyId] })
    },
  })
}
