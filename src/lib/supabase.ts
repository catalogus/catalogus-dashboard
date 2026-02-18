import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Author = Tables<'authors'>
export type AuthorInsert = TablesInsert<'authors'>
export type AuthorUpdate = TablesUpdate<'authors'>

export type Book = Tables<'books'>
export type BookInsert = TablesInsert<'books'>
export type BookUpdate = TablesUpdate<'books'>

export type HeroSlide = Tables<'hero_slides'>
export type HeroSlideInsert = TablesInsert<'hero_slides'>
export type HeroSlideUpdate = TablesUpdate<'hero_slides'>

export type Order = Tables<'orders'>
export type OrderInsert = TablesInsert<'orders'>
export type OrderUpdate = TablesUpdate<'orders'>

export type OrderItem = Tables<'order_items'>
export type OrderItemInsert = TablesInsert<'order_items'>

export type Post = Tables<'posts'>
export type PostInsert = TablesInsert<'posts'>
export type PostUpdate = TablesUpdate<'posts'>

export type Profile = Tables<'profiles'>
export type ProfileInsert = TablesInsert<'profiles'>
export type ProfileUpdate = TablesUpdate<'profiles'>

export type Publication = Tables<'publications'>
export type PublicationInsert = TablesInsert<'publications'>
export type PublicationUpdate = TablesUpdate<'publications'>

export type AuthorClaim = Tables<'author_claims'>
export type AuthorClaimInsert = TablesInsert<'author_claims'>
export type AuthorClaimUpdate = TablesUpdate<'author_claims'>

export type BookShop = Database['public']['Views']['books_shop']['Row']
