export type Row = {
    id: string | number
    uid?: string | null
    product_name?: string | null
    article?: string | null
    code_1c?: string | null
    short_description?: string | null
    description?: string | null
    description_added?: boolean | null
    push_to_pim?: boolean | null
    description_confirmed?: boolean | null
    confirmed_by_email?: string | null
    created_at?: string | null
    updated_at?: string | null
    locked_until?: string | null
    link_pim?: string
}
