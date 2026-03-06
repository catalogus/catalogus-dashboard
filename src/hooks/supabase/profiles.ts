import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/hooks/supabase/query-keys'
import { supabase } from '@/lib/supabase'
import type { Profile, ProfileInsert, ProfileUpdate } from '@/lib/supabase'

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles.all(),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useProfileStats() {
  return useQuery({
    queryKey: queryKeys.profiles.stats(),
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('role, status')
      if (error) throw error

      return {
        total: data?.length || 0,
        admins: data?.filter((p) => p.role === 'admin').length || 0,
        authors: data?.filter((p) => p.role === 'author').length || 0,
        pending: data?.filter((p) => p.status === 'pending').length || 0,
      }
    },
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ profile, password }: { profile: ProfileInsert; password: string }) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: profile.email || '',
        password,
        options: {
          data: {
            name: profile.name,
            role: profile.role,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      const { id: _id, ...profileWithoutId } = profile
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          ...profileWithoutId,
        })
        .select()
        .single()

      if (error) throw error
      void _id
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.stats() })
    },
  })
}

export function useInviteStaffUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      name,
      email,
      adminLevel,
    }: {
      name: string
      email: string
      adminLevel: 'super_admin' | 'content_admin'
    }) => {
      const { data, error } = await supabase.functions.invoke('invite-staff-user', {
        body: {
          name,
          email,
          admin_level: adminLevel,
        },
      })

      if (error) throw error
      if (data?.error) throw new Error(String(data.error))

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.stats() })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & ProfileUpdate) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.stats() })
    },
  })
}

export function useDeleteProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles.stats() })
    },
  })
}
