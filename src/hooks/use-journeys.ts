import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Journey, FullJourney, Phase1, Phase2, Phase3Entry } from '@/types/journey'

function mapJourney(row: Record<string, unknown>): Journey {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    schemaVersion: row.schema_version as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

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
    conversation: (row.conversation ?? []) as Phase1['conversation'],
    updatedAt: row.updated_at as string,
  }
}

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

export function useJourneys() {
  return useQuery({
    queryKey: ['journeys'],
    queryFn: async (): Promise<Journey[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map(mapJourney)
    },
  })
}

export function useJourney(id: string) {
  return useQuery({
    queryKey: ['journey', id],
    enabled: !!id,
    queryFn: async (): Promise<FullJourney> => {
      const { data, error } = await supabase
        .from('journeys')
        .select('*, phase1(*), phase2(*), phase3_entries(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      const journey = mapJourney(data)
      const phase1 = data.phase1?.[0] ? mapPhase1(data.phase1[0]) : null
      const phase2 = data.phase2?.[0] ? mapPhase2(data.phase2[0]) : null
      const phase3Entries = (data.phase3_entries ?? []).map(mapPhase3Entry)

      return { ...journey, phase1, phase2, phase3Entries }
    },
  })
}

export function useCreateJourney() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (name: string): Promise<Journey> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('journeys')
        .insert({ user_id: user.id, name, schema_version: 1 })
        .select()
        .single()

      if (error) throw error

      const { error: p1Error } = await supabase
        .from('phase1')
        .insert({ journey_id: data.id })

      if (p1Error) throw p1Error

      const { error: p2Error } = await supabase
        .from('phase2')
        .insert({ journey_id: data.id })

      if (p2Error) throw p2Error

      return mapJourney(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] })
    },
  })
}

export function useDeleteJourney() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('journeys').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] })
    },
  })
}
