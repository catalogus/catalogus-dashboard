export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      author_claims: {
        Row: {
          author_id: string
          claimed_at: string
          created_at: string
          id: string
          notes: string | null
          profile_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at: string
        }
        Insert: {
          author_id: string
          claimed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          profile_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Update: {
          author_id?: string
          claimed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          profile_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "author_claims_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_claims_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "author_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          actor_role: Database["public"]["Enums"]["user_role"] | null
          changed_fields: Json
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json
          occurred_at: string
          outcome: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          changed_fields?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json
          occurred_at?: string
          outcome?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["user_role"] | null
          changed_fields?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json
          occurred_at?: string
          outcome?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          author_gallery: Json | null
          author_type: string | null
          bio: string | null
          birth_date: string | null
          claim_reviewed_at: string | null
          claim_reviewed_by: string | null
          claim_status: Database["public"]["Enums"]["claim_status"]
          claimed_at: string | null
          created_at: string
          featured: boolean | null
          featured_video: string | null
          id: string
          name: string
          phone: string | null
          photo_path: string | null
          photo_url: string | null
          profile_id: string | null
          province: string | null
          published_works: Json | null
          residence_city: string | null
          social_links: Json | null
          updated_at: string
          wp_id: number | null
          wp_slug: string | null
        }
        Insert: {
          author_gallery?: Json | null
          author_type?: string | null
          bio?: string | null
          birth_date?: string | null
          claim_reviewed_at?: string | null
          claim_reviewed_by?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          claimed_at?: string | null
          created_at?: string
          featured?: boolean | null
          featured_video?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_path?: string | null
          photo_url?: string | null
          profile_id?: string | null
          province?: string | null
          published_works?: Json | null
          residence_city?: string | null
          social_links?: Json | null
          updated_at?: string
          wp_id?: number | null
          wp_slug?: string | null
        }
        Update: {
          author_gallery?: Json | null
          author_type?: string | null
          bio?: string | null
          birth_date?: string | null
          claim_reviewed_at?: string | null
          claim_reviewed_by?: string | null
          claim_status?: Database["public"]["Enums"]["claim_status"]
          claimed_at?: string | null
          created_at?: string
          featured?: boolean | null
          featured_video?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_path?: string | null
          photo_url?: string | null
          profile_id?: string | null
          province?: string | null
          published_works?: Json | null
          residence_city?: string | null
          social_links?: Json | null
          updated_at?: string
          wp_id?: number | null
          wp_slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authors_claim_reviewed_by_fkey"
            columns: ["claim_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_claim_reviewed_by_fkey"
            columns: ["claim_reviewed_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authors_books: {
        Row: {
          author_id: string
          book_id: string
        }
        Insert: {
          author_id: string
          book_id: string
        }
        Update: {
          author_id?: string
          book_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "authors_books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authors_books_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_shop"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          category: string | null
          cover_path: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          description_json: Json | null
          digital_access: Database["public"]["Enums"]["digital_access"] | null
          digital_file_path: string | null
          digital_file_url: string | null
          featured: boolean | null
          id: string
          is_active: boolean
          is_digital: boolean
          isbn: string | null
          language: Database["public"]["Enums"]["language_code"]
          price_mzn: number
          promo_end_date: string | null
          promo_price_mzn: number | null
          promo_start_date: string | null
          promo_type: string | null
          publisher: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          stock: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_json?: Json | null
          digital_access?: Database["public"]["Enums"]["digital_access"] | null
          digital_file_path?: string | null
          digital_file_url?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean
          is_digital?: boolean
          isbn?: string | null
          language?: Database["public"]["Enums"]["language_code"]
          price_mzn: number
          promo_end_date?: string | null
          promo_price_mzn?: number | null
          promo_start_date?: string | null
          promo_type?: string | null
          publisher?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          stock?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_json?: Json | null
          digital_access?: Database["public"]["Enums"]["digital_access"] | null
          digital_file_path?: string | null
          digital_file_url?: string | null
          featured?: boolean | null
          id?: string
          is_active?: boolean
          is_digital?: boolean
          isbn?: string | null
          language?: Database["public"]["Enums"]["language_code"]
          price_mzn?: number
          promo_end_date?: string | null
          promo_price_mzn?: number | null
          promo_start_date?: string | null
          promo_type?: string | null
          publisher?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          stock?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          accent_color: string | null
          background_image_path: string | null
          background_image_url: string | null
          content_id: string | null
          content_type: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_weight: number | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_image_path?: string | null
          background_image_url?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_weight?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_image_path?: string | null
          background_image_url?: string | null
          content_id?: string | null
          content_type?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_weight?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mpesa_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          conversation_id: string | null
          created_at: string
          currency: string
          customer_msisdn: string
          id: string
          order_id: string
          request_payload: Json | null
          response_payload: Json | null
          result_code: string | null
          result_desc: string | null
          service_provider_code: string
          status: string
          third_party_conversation_id: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          currency?: string
          customer_msisdn: string
          id?: string
          order_id: string
          request_payload?: Json | null
          response_payload?: Json | null
          result_code?: string | null
          result_desc?: string | null
          service_provider_code: string
          status?: string
          third_party_conversation_id: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          conversation_id?: string | null
          created_at?: string
          currency?: string
          customer_msisdn?: string
          id?: string
          order_id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          result_code?: string | null
          result_desc?: string | null
          service_provider_code?: string
          status?: string
          third_party_conversation_id?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscriptions: {
        Row: {
          created_at: string
          download_token_hash: string | null
          email: string
          id: string
          status: Database["public"]["Enums"]["newsletter_status"]
          updated_at: string
          verification_expires_at: string | null
          verification_token_hash: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          download_token_hash?: string | null
          email: string
          id?: string
          status?: Database["public"]["Enums"]["newsletter_status"]
          updated_at?: string
          verification_expires_at?: string | null
          verification_token_hash?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          download_token_hash?: string | null
          email?: string
          id?: string
          status?: Database["public"]["Enums"]["newsletter_status"]
          updated_at?: string
          verification_expires_at?: string | null
          verification_token_hash?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          book_id: string
          id: number
          order_id: string
          price: number
          quantity: number
        }
        Insert: {
          book_id: string
          id?: number
          order_id: string
          price: number
          quantity: number
        }
        Update: {
          book_id?: string
          id?: number
          order_id?: string
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books_shop"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          mpesa_conversation_id: string | null
          mpesa_last_response: Json | null
          mpesa_reference: string | null
          mpesa_transaction_id: string | null
          order_number: string
          paid_at: string | null
          payment_completed_at: string | null
          payment_initiated_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          mpesa_conversation_id?: string | null
          mpesa_last_response?: Json | null
          mpesa_reference?: string | null
          mpesa_transaction_id?: string | null
          order_number?: string
          paid_at?: string | null
          payment_completed_at?: string | null
          payment_initiated_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          mpesa_conversation_id?: string | null
          mpesa_last_response?: Json | null
          mpesa_reference?: string | null
          mpesa_transaction_id?: string | null
          order_number?: string
          paid_at?: string | null
          payment_completed_at?: string | null
          payment_initiated_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      post_categories: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          order_weight: number | null
          parent_id: string | null
          slug: string
          slug_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          order_weight?: number | null
          parent_id?: string | null
          slug: string
          slug_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          order_weight?: number | null
          parent_id?: string | null
          slug?: string
          slug_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories_map: {
        Row: {
          category_id: string
          post_id: string
        }
        Insert: {
          category_id: string
          post_id: string
        }
        Update: {
          category_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_map_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "post_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_categories_map_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string
          description: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          slug: string
          slug_en: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          slug: string
          slug_en?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          slug?: string
          slug_en?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      post_tags_map: {
        Row: {
          post_id: string
          tag_id: string
        }
        Insert: {
          post_id: string
          tag_id: string
        }
        Update: {
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_map_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "post_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          body: string | null
          content_json: Json | null
          created_at: string
          excerpt: string | null
          featured: boolean | null
          featured_image_path: string | null
          featured_image_url: string | null
          id: string
          language: Database["public"]["Enums"]["language_code"]
          post_type: string | null
          previous_status: Database["public"]["Enums"]["content_status"] | null
          published_at: string | null
          slug: string
          source_post_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          translated_at: string | null
          translation_error: string | null
          translation_group_id: string
          translation_source_hash: string | null
          translation_status:
            | Database["public"]["Enums"]["translation_status"]
            | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          content_json?: Json | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          featured_image_path?: string | null
          featured_image_url?: string | null
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          post_type?: string | null
          previous_status?: Database["public"]["Enums"]["content_status"] | null
          published_at?: string | null
          slug: string
          source_post_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          translated_at?: string | null
          translation_error?: string | null
          translation_group_id?: string
          translation_source_hash?: string | null
          translation_status?:
            | Database["public"]["Enums"]["translation_status"]
            | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          body?: string | null
          content_json?: Json | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean | null
          featured_image_path?: string | null
          featured_image_url?: string | null
          id?: string
          language?: Database["public"]["Enums"]["language_code"]
          post_type?: string | null
          previous_status?: Database["public"]["Enums"]["content_status"] | null
          published_at?: string | null
          slug?: string
          source_post_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          translated_at?: string | null
          translation_error?: string | null
          translation_group_id?: string
          translation_source_hash?: string | null
          translation_status?:
            | Database["public"]["Enums"]["translation_status"]
            | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          author_gallery: Json | null
          author_type: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          email: string | null
          featured: boolean | null
          featured_video: string | null
          id: string
          name: string
          phone: string | null
          photo_path: string | null
          photo_url: string | null
          province: string | null
          published_works: Json | null
          residence_city: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_links: Json | null
          status: Database["public"]["Enums"]["author_status"] | null
          updated_at: string
        }
        Insert: {
          author_gallery?: Json | null
          author_type?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          featured?: boolean | null
          featured_video?: string | null
          id: string
          name: string
          phone?: string | null
          photo_path?: string | null
          photo_url?: string | null
          province?: string | null
          published_works?: Json | null
          residence_city?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          status?: Database["public"]["Enums"]["author_status"] | null
          updated_at?: string
        }
        Update: {
          author_gallery?: Json | null
          author_type?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          featured?: boolean | null
          featured_video?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_path?: string | null
          photo_url?: string | null
          province?: string | null
          published_works?: Json | null
          residence_city?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_links?: Json | null
          status?: Database["public"]["Enums"]["author_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          is_active: boolean
          link: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      publication_pages: {
        Row: {
          created_at: string
          height: number | null
          id: string
          image_path: string
          image_url: string | null
          page_number: number
          publication_id: string
          text_content: string | null
          thumbnail_path: string | null
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          image_path: string
          image_url?: string | null
          page_number: number
          publication_id: string
          text_content?: string | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          image_path?: string
          image_url?: string | null
          page_number?: number
          publication_id?: string
          text_content?: string | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publication_pages_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "publications"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          cover_path: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_mode: Database["public"]["Enums"]["display_mode"]
          file_size_bytes: number | null
          id: string
          is_active: boolean
          is_featured: boolean
          page_count: number | null
          page_height: number
          page_width: number
          pdf_path: string
          pdf_url: string | null
          publish_date: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          table_of_contents: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_mode?: Database["public"]["Enums"]["display_mode"]
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          page_count?: number | null
          page_height?: number
          page_width?: number
          pdf_path: string
          pdf_url?: string | null
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          table_of_contents?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_mode?: Database["public"]["Enums"]["display_mode"]
          file_size_bytes?: number | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          page_count?: number | null
          page_height?: number
          page_width?: number
          pdf_path?: string
          pdf_url?: string | null
          publish_date?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          table_of_contents?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          order_weight: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_weight?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_weight?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      books_shop: {
        Row: {
          category: string | null
          cover_path: string | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          description_json: Json | null
          digital_access: Database["public"]["Enums"]["digital_access"] | null
          digital_file_path: string | null
          digital_file_url: string | null
          effective_price_mzn: number | null
          featured: boolean | null
          id: string | null
          is_active: boolean | null
          is_digital: boolean | null
          isbn: string | null
          language: Database["public"]["Enums"]["language_code"] | null
          price_mzn: number | null
          promo_end_date: string | null
          promo_is_active: boolean | null
          promo_price_mzn: number | null
          promo_start_date: string | null
          promo_type: string | null
          publisher: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          stock: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          description_json?: Json | null
          digital_access?: Database["public"]["Enums"]["digital_access"] | null
          digital_file_path?: string | null
          digital_file_url?: string | null
          effective_price_mzn?: never
          featured?: boolean | null
          id?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          isbn?: string | null
          language?: Database["public"]["Enums"]["language_code"] | null
          price_mzn?: number | null
          promo_end_date?: string | null
          promo_is_active?: never
          promo_price_mzn?: number | null
          promo_start_date?: string | null
          promo_type?: string | null
          publisher?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          stock?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          description_json?: Json | null
          digital_access?: Database["public"]["Enums"]["digital_access"] | null
          digital_file_path?: string | null
          digital_file_url?: string | null
          effective_price_mzn?: never
          featured?: boolean | null
          id?: string | null
          is_active?: boolean | null
          is_digital?: boolean | null
          isbn?: string | null
          language?: Database["public"]["Enums"]["language_code"] | null
          price_mzn?: number | null
          promo_end_date?: string | null
          promo_is_active?: never
          promo_price_mzn?: number | null
          promo_start_date?: string | null
          promo_type?: string | null
          publisher?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          stock?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          author_gallery: Json | null
          author_type: string | null
          bio: string | null
          birth_date: string | null
          featured_video: string | null
          id: string | null
          name: string | null
          photo_path: string | null
          photo_url: string | null
          province: string | null
          published_works: Json | null
          residence_city: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          status: Database["public"]["Enums"]["author_status"] | null
        }
        Insert: {
          author_gallery?: Json | null
          author_type?: string | null
          bio?: string | null
          birth_date?: string | null
          featured_video?: string | null
          id?: string | null
          name?: string | null
          photo_path?: string | null
          photo_url?: string | null
          province?: string | null
          published_works?: Json | null
          residence_city?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["author_status"] | null
        }
        Update: {
          author_gallery?: Json | null
          author_type?: string | null
          bio?: string | null
          birth_date?: string | null
          featured_video?: string | null
          id?: string | null
          name?: string | null
          photo_path?: string | null
          photo_url?: string | null
          province?: string | null
          published_works?: Json | null
          residence_city?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          status?: Database["public"]["Enums"]["author_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_order_atomic: {
        Args: {
          p_customer_email: string
          p_customer_id: string
          p_customer_name: string
          p_customer_phone: string
          p_items: Json
          p_total: number
        }
        Returns: Json
      }
      decrement_book_stock: {
        Args: { book_id: string; quantity: number }
        Returns: undefined
      }
      get_admin_dashboard_metrics: {
        Args: {
          p_end_date: string
          p_low_stock_threshold?: number
          p_recent_orders_limit?: number
          p_start_date: string
          p_timezone?: string
          p_top_books_limit?: number
        }
        Returns: Json
      }
      get_mpesa_transaction_status: {
        Args: { p_order_id: string }
        Returns: {
          completed_at: string
          created_at: string
          result_desc: string
          status: string
          transaction_id: string
        }[]
      }
      get_shop_metadata: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_changed_fields?: Json
          p_entity_id?: string | null
          p_entity_type: string
          p_meta?: Json
          p_outcome?: string
          p_summary?: string | null
        }
        Returns: string
      }
      mark_order_failed: {
        Args: {
          p_order_id: string
          p_reference: string
          p_response?: Json
          p_transaction_id: string
        }
        Returns: Json
      }
      mark_order_paid: {
        Args: {
          p_amount: number
          p_order_id: string
          p_reference: string
          p_response?: Json
          p_transaction_id: string
        }
        Returns: Json
      }
      purge_old_audit_events: {
        Args: { p_days?: number }
        Returns: number
      }
    }
    Enums: {
      author_status: "pending" | "approved" | "rejected"
      claim_status: "unclaimed" | "pending" | "approved" | "rejected"
      content_status: "draft" | "published" | "scheduled" | "trash" | "pending"
      digital_access: "paid" | "free"
      display_mode: "single" | "double"
      language_code: "pt" | "en"
      newsletter_status: "pending" | "verified"
      order_status: "pending" | "processing" | "paid" | "failed" | "cancelled"
      translation_status: "pending" | "review" | "failed"
      user_role: "admin" | "author" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      author_status: ["pending", "approved", "rejected"],
      claim_status: ["unclaimed", "pending", "approved", "rejected"],
      content_status: ["draft", "published", "scheduled", "trash", "pending"],
      digital_access: ["paid", "free"],
      display_mode: ["single", "double"],
      language_code: ["pt", "en"],
      newsletter_status: ["pending", "verified"],
      order_status: ["pending", "processing", "paid", "failed", "cancelled"],
      translation_status: ["pending", "review", "failed"],
      user_role: ["admin", "author", "customer"],
    },
  },
} as const
