import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type ClaimStatus = Database['public']['Enums']['claim_status']
type AuthorClaimRow = Database['public']['Tables']['author_claims']['Row']
type ClaimAuthorRow = Pick<Database['public']['Tables']['authors']['Row'],
  'id' | 'name' | 'photo_url' | 'wp_slug' | 'profile_id' | 'claim_status' | 'claimed_at' | 'claim_reviewed_at' | 'claim_reviewed_by'> & {
  profiles: Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'email' | 'status' | 'photo_url'> | null
}

export function useAuthorClaims(filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all') {
  return useQuery({
    queryKey: queryKeys.claims.all(filter),
    queryFn: async () => {
      let query = supabase
        .from('authors')
        .select(
          'id, name, photo_url, wp_slug, profile_id, claim_status, claimed_at, claim_reviewed_at, claim_reviewed_by, profiles!authors_profile_id_fkey(id, name, email, status, photo_url)',
        )
        .not('claim_status', 'eq', 'unclaimed')
        .order('claimed_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('claim_status', filter)
      }

      const { data: authorsData, error } = await query
      if (error) throw error

      const claimsWithNotes = await Promise.all(
        ((authorsData ?? []) as ClaimAuthorRow[]).map(async (author) => {
          if (author.profile_id && (author.claim_status === 'pending' || author.claim_status === 'rejected')) {
            const { data: claimData } = await supabase
              .from('author_claims')
              .select('id, notes, status, reviewed_at, reviewed_by')
              .eq('author_id', author.id)
              .eq('profile_id', author.profile_id)
              .eq('status', author.claim_status)
              .order('claimed_at', { ascending: false })
              .maybeSingle()

            return {
              ...author,
              claim_id: claimData?.id ?? null,
              notes: claimData?.notes ?? null,
              audit_status: claimData?.status ?? null,
              audit_reviewed_at: claimData?.reviewed_at ?? null,
              audit_reviewed_by: claimData?.reviewed_by ?? null,
            }
          }

          return {
            ...author,
            claim_id: null,
            notes: null,
            audit_status: null,
            audit_reviewed_at: null,
            audit_reviewed_by: null,
          }
        }),
      )

      return claimsWithNotes
    },
  })
}

export function useAuthorClaimStats() {
  return useQuery({
    queryKey: queryKeys.claims.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authors')
        .select('claim_status')
        .not('claim_status', 'eq', 'unclaimed')
      if (error) throw error

      return {
        total: data?.length || 0,
        pending: data?.filter((c) => c.claim_status === 'pending').length || 0,
        approved: data?.filter((c) => c.claim_status === 'approved').length || 0,
        rejected: data?.filter((c) => c.claim_status === 'rejected').length || 0,
      }
    },
  })
}

export function useReviewAuthorClaim() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      authorId,
      profileId,
      status,
      reviewerId,
    }: {
      authorId: string
      profileId: string
      status: 'approved' | 'rejected'
      reviewerId?: string | null
    }) => {
      const reviewedAt = new Date().toISOString()

      const { error: authorError } = await supabase
        .from('authors')
        .update({
          claim_status: status,
          claim_reviewed_at: reviewedAt,
          claim_reviewed_by: reviewerId ?? null,
        })
        .eq('id', authorId)

      if (authorError) throw authorError

      if (status === 'approved') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ status: 'approved' })
          .eq('id', profileId)
          .eq('status', 'pending')

        if (profileError) throw profileError
      }

      const { error: auditError } = await supabase
        .from('author_claims')
        .update({
          status: status as ClaimStatus,
          reviewed_at: reviewedAt,
          reviewed_by: reviewerId ?? null,
        } satisfies Partial<AuthorClaimRow>)
        .eq('author_id', authorId)
        .eq('profile_id', profileId)
        .eq('status', 'pending')

      if (auditError) throw auditError

      return { authorId, status }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.claims.root() })
      queryClient.invalidateQueries({ queryKey: queryKeys.claims.stats() })
      queryClient.invalidateQueries({ queryKey: queryKeys.authors.root() })
      queryClient.invalidateQueries({ queryKey: queryKeys.authors.stats() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.stats() })
    },
  })
}
