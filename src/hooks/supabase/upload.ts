import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useUploadFile() {
  return useMutation({
    mutationFn: async ({
      file,
      bucket = 'post-images',
      folder = '',
    }: {
      file: File
      bucket?: string
      folder?: string
    }) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder ? `${folder}/` : ''}${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path)

      return publicUrl
    },
  })
}
