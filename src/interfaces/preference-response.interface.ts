export interface PreferenceResponse {
  id?: string;
  preference_id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  external_reference?: string;
  collector_id?: number;
  date_created?: string;
  items?: {
    id?: string;
    title?: string;
    quantity?: number;
    unit_price?: number;
    currency_id?: string;
  }[];
}
