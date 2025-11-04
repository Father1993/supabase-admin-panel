export type Category = {
  id: number
  parent_id?: number | null
  header?: string | null
  sync_uid?: string | null
  level?: number | null
  product_count?: number | null
  product_count_additional?: number | null
  created_at?: string | null
  updated_at?: string | null
  description_added?: boolean | null
  description?: string | null
  push_to_pim?: boolean | null
  description_confirmed?: boolean | null
  confirmed_by_email?: string | null
  is_rejected?: boolean | null
}
