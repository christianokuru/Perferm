/**
 * Generated from the Perferm Supabase schema (supabase/migrations).
 * Regenerate after schema changes: `npx supabase gen types typescript --project-id <ref>`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Rel = { foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] };

type Enums_ = {
  contact_topic: "order" | "recommendation" | "wholesale" | "press" | "other";
  fulfilment_method: "delivery" | "pickup";
  message_status: "new" | "handled" | "archived";
  order_status: "pending" | "paid" | "processing" | "shipped" | "ready_for_pickup" | "delivered" | "cancelled";
  payment_mode: "live" | "demo";
  payment_provider: "paystack" | "flutterwave";
  product_concentration: "extrait" | "edp" | "edt" | "attar" | "bakhoor" | "gift-set";
  product_gender: "her" | "him" | "unisex";
  review_status: "pending" | "approved" | "rejected";
  scent_family: "woody" | "oriental" | "floral" | "fresh" | "gourmand" | "musky" | "citrus";
  user_role: "customer" | "admin";
};

/** Builds Insert/Update shapes: `Req` keys are required on insert, the rest optional. */
type Table<Row, Req extends keyof Row, Relationships extends Rel[] = []> = {
  Row: Row;
  Insert: Pick<Row, Req> & Partial<Omit<Row, Req>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

type OrderRow = {
  access_key_hash: string;
  cancel_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  currency: string;
  customer_name: string;
  delivered_at: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_fee_kobo: number;
  delivery_notes: string | null;
  delivery_state: string | null;
  email: string;
  fulfilment: Enums_["fulfilment_method"];
  id: string;
  paid_at: string | null;
  payment_mode: Enums_["payment_mode"];
  payment_provider: Enums_["payment_provider"];
  phone: string;
  pickup_location: string | null;
  provider_transaction_id: string | null;
  reference: string;
  shipped_at: string | null;
  status: Enums_["order_status"];
  stock_issue: boolean;
  subtotal_kobo: number;
  total_kobo: number;
  updated_at: string;
  user_id: string | null;
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" };
  public: {
    Tables: {
      addresses: Table<
        { address: string; city: string; created_at: string; id: string; is_default: boolean; label: string; phone: string; recipient: string; state: string; updated_at: string; user_id: string },
        "address" | "city" | "label" | "phone" | "recipient" | "state" | "user_id",
        [
          { foreignKeyName: "addresses_state_fkey"; columns: ["state"]; isOneToOne: false; referencedRelation: "delivery_zones"; referencedColumns: ["state"] },
          { foreignKeyName: "addresses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      >;
      audit_log: Table<
        { action: string; actor_id: string | null; created_at: string; details: Json; entity: string; entity_id: string | null; id: number },
        "action" | "entity"
      >;
      collections: Table<
        { accent: string; created_at: string; description: string; eyebrow: string; image_alt: string; image_src: string; position: number; slug: string; title: string; updated_at: string },
        "accent" | "description" | "eyebrow" | "image_alt" | "image_src" | "slug" | "title"
      >;
      contact_messages: Table<
        { created_at: string; email: string; handled_at: string | null; handled_by: string | null; id: string; message: string; name: string; status: Enums_["message_status"]; topic: Enums_["contact_topic"]; user_id: string | null },
        "email" | "message" | "name" | "topic"
      >;
      delivery_zones: Table<{ eta: string; fee_kobo: number; is_active: boolean; state: string; updated_at: string }, "eta" | "fee_kobo" | "state">;
      newsletter_subscribers: Table<
        { created_at: string; email: string; id: string; source: string; unsubscribe_token: string; unsubscribed_at: string | null },
        "email"
      >;
      order_events: Table<
        { actor_id: string | null; created_at: string; id: number; is_internal: boolean; kind: string; message: string | null; order_id: string; status: Enums_["order_status"] | null },
        "kind" | "order_id",
        [{ foreignKeyName: "order_events_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] }]
      >;
      order_items: Table<
        {
          house: string; id: string; image_src: string; line_total_kobo: number | null; order_id: string; product_id: string | null; product_name: string;
          product_slug: string; quantity: number; unit_price_kobo: number; variant_id: string | null; variant_label: string;
        },
        "house" | "image_src" | "order_id" | "product_name" | "product_slug" | "quantity" | "unit_price_kobo" | "variant_label",
        [
          { foreignKeyName: "order_items_order_id_fkey"; columns: ["order_id"]; isOneToOne: false; referencedRelation: "orders"; referencedColumns: ["id"] },
          { foreignKeyName: "order_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ]
      >;
      orders: Table<
        OrderRow,
        "access_key_hash" | "customer_name" | "delivery_fee_kobo" | "email" | "fulfilment" | "payment_mode" | "payment_provider" | "phone" | "reference" | "subtotal_kobo" | "total_kobo",
        [{ foreignKeyName: "orders_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      >;
      payment_events: Table<
        { event_key: string; event_type: string; id: number; outcome: string | null; payload: Json; provider: Enums_["payment_provider"]; received_at: string; reference: string | null },
        "event_key" | "event_type" | "provider"
      >;
      product_collections: Table<
        { collection_slug: string; product_id: string },
        "collection_slug" | "product_id",
        [
          { foreignKeyName: "product_collections_collection_slug_fkey"; columns: ["collection_slug"]; isOneToOne: false; referencedRelation: "collections"; referencedColumns: ["slug"] },
          { foreignKeyName: "product_collections_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ]
      >;
      product_images: Table<
        { alt: string; created_at: string; id: string; position: number; product_id: string; src: string; storage_path: string | null },
        "alt" | "product_id" | "src",
        [{ foreignKeyName: "product_images_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }]
      >;
      product_variants: Table<
        { compare_at_kobo: number | null; created_at: string; id: string; label: string; position: number; price_kobo: number; product_id: string; stock: number; updated_at: string },
        "label" | "price_kobo" | "product_id",
        [{ foreignKeyName: "product_variants_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }]
      >;
      products: Table<
        {
          archived_at: string | null; concentration: Enums_["product_concentration"]; created_at: string; description: string; families: Enums_["scent_family"][];
          gender: Enums_["product_gender"]; house: string; id: string; is_bestseller: boolean; is_new: boolean; longevity: string; name: string;
          notes_base: string[]; notes_heart: string[]; notes_top: string[]; rating: number; review_count: number; sillage: string; slug: string;
          tagline: string; updated_at: string;
        },
        "concentration" | "description" | "families" | "gender" | "house" | "longevity" | "name" | "sillage" | "slug" | "tagline"
      >;
      profiles: Table<
        { created_at: string; email: string; full_name: string; id: string; phone: string | null; role: Enums_["user_role"]; updated_at: string },
        "id"
      >;
      rate_limits: Table<{ bucket: string; hits: number; window_start: string }, "bucket" | "window_start">;
      reviews: Table<
        {
          author_name: string; body: string; city: string | null; created_at: string; id: string; moderated_at: string | null; moderated_by: string | null;
          product_id: string; rating: number; status: Enums_["review_status"]; title: string; user_id: string | null; verified_purchase: boolean;
        },
        "author_name" | "body" | "product_id" | "rating" | "title",
        [{ foreignKeyName: "reviews_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }]
      >;
      store_settings: Table<
        {
          announcement: string; flutterwave_enabled: boolean; id: number; paystack_enabled: boolean; pickup_address: string; pickup_enabled: boolean;
          pickup_hours: string; store_name: string; support_email: string; support_phone: string; updated_at: string; updated_by: string | null;
        },
        "pickup_address" | "pickup_hours" | "store_name" | "support_email" | "support_phone"
      >;
      wishlist_items: Table<
        { created_at: string; product_id: string; user_id: string },
        "product_id" | "user_id",
        [{ foreignKeyName: "wishlist_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] }]
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_add_order_note: { Args: { p_note: string; p_order_id: string }; Returns: undefined };
      admin_customers: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string };
        Returns: {
          created_at: string; email: string; full_name: string; id: string; order_count: number; phone: string | null;
          role: Enums_["user_role"]; total_count: number; total_spent_kobo: number;
        }[];
      };
      admin_dashboard: { Args: never; Returns: Json };
      admin_order_counts: { Args: never; Returns: Json };
      admin_set_order_status: {
        Args: { p_note?: string; p_order_id: string; p_status: Enums_["order_status"] };
        Returns: OrderRow;
        SetofOptions: { from: "*"; to: "orders"; isOneToOne: true; isSetofReturn: false };
      };
      admin_save_product: { Args: { p: Json }; Returns: string };
      admin_set_user_role: { Args: { p_role: Enums_["user_role"]; p_user_id: string }; Returns: undefined };
      confirm_order_payment: {
        Args: { p_amount_kobo: number; p_mode: Enums_["payment_mode"]; p_provider: Enums_["payment_provider"]; p_reference: string; p_transaction_id: string };
        Returns: Json;
      };
      create_order: { Args: { p_items: Json; p_order: Json }; Returns: { id: string; reference: string; total_kobo: number }[] };
      expire_pending_orders: { Args: { p_older_than?: string }; Returns: number };
      rate_limit_hit: { Args: { p_bucket: string; p_limit: number; p_window_seconds: number }; Returns: boolean };
    };
    Enums: Enums_;
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
