export type Row = {
	id: string | number;
	row_number?: number | null;
	uid?: string | null;
	product_name?: string | null;
	short_description?: string | null;
	description?: string | null;
	description_added?: boolean | null;
	push_to_pim?: boolean | null;
	description_confirmed?: boolean | null;
	confirmed_by_email?: string | null;
};