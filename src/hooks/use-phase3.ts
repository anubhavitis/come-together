import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Phase3Entry } from '@/types/journey'

function mapPhase3Entry(row: Record<string, unknown>): Phase3Entry {
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    label: row.label as string,
    completedAt: row.completed_at as string | null,
    swemwbs: row.swemwbs as Phase3Entry['swemwbs'],
    innerLandscapeText: row.inner_landscape_text as Phase3Entry['innerLandscapeText'],
    innerLandscapeRatings: row.inner_landscape_ratings as Phase3Entry['innerLandscapeRatings'],
    engagedIntegration: row.engaged_integration as Phase3Entry['engagedIntegration'],
    experiencedIntegration: row.experienced_integration as Phase3Entry['experiencedIntegration'],
    intentionIntegration: row.intention_integration as Phase3Entry['intentionIntegration'],
    openReflection: row.open_reflection as Phase3Entry['openReflection'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function toSnake(data: Partial<Phase3Entry>): Record<string, unknown> {
  const map: Record<string, string> = {
    journeyId: 'journey_id',
    completedAt: 'completed_at',
    innerLandscapeText: 'inner_landscape_text',
    innerLandscapeRatings: 'inner_landscape_ratings',
    engagedIntegration: 'engaged_integration',
    experiencedIntegration: 'experienced_integration',
    intentionIntegration: 'intention_integration',
    openReflection: 'open_reflection',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue
    result[map[key] ?? key] = value
  }
  return result
}

export function usePhase3Entries(journeyId: string) {
  return useQuery({
    queryKey: ['phase3', journeyId],
    enabled: !!journeyId,
    queryFn: async (): Promise<Phase3Entry[]> => {
      const { data, error } = await supabase
        .from('phase3_entries')
        .select('*')
        .eq('journey_id', journeyId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []).map(mapPhase3Entry)
    },
  })
}

export function usePhase3Entry(entryId: string) {
  return useQuery({
    queryKey: ['phase3-entry', entryId],
    enabled: !!entryId,
    queryFn: async (): Promise<Phase3Entry> => {
      const { data, error } = await supabase
        .from('phase3_entries')
        .select('*')
        .eq('id', entryId)
        .single()

      if (error) throw error
      return mapPhase3Entry(data)
    },
  })
}

export function useCreatePhase3Entry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { journeyId: string; label: string }): Promise<Phase3Entry> => {
      const { data, error } = await supabase
        .from('phase3_entries')
        .insert({ journey_id: input.journeyId, label: input.label })
        .select()
        .single()

      if (error) throw error
      return mapPhase3Entry(data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phase3', variables.journeyId] })
      queryClient.invalidateQueries({ queryKey: ['journey', variables.journeyId] })
    },
  })
}

export function useUpsertPhase3Entry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: Partial<Phase3Entry> & { id: string; journeyId: string },
    ): Promise<Phase3Entry> => {
      const { id, journeyId, ...rest } = input
      const row = toSnake({ ...rest, journeyId })

      const { data, error } = await supabase
        .from('phase3_entries')
        .update(row)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return mapPhase3Entry(data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['phase3', variables.journeyId] })
      queryClient.invalidateQueries({ queryKey: ['phase3-entry', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['journey', variables.journeyId] })
    },
  })
}
