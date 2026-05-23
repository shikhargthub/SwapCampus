export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ItemStatus = "pending" | "approved" | "rejected" | "sold";
export type AppRole = "admin" | "moderator" | "user";

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { created_at: string; icon: string | null; id: string; name: string };
        Insert: { created_at?: string; icon?: string | null; id?: string; name: string };
        Update: { created_at?: string; icon?: string | null; id?: string; name?: string };
        Relationships: [];
      };
      colleges: {
        Row: { created_at: string; email_domain: string; id: string; name: string };
        Insert: { created_at?: string; email_domain: string; id?: string; name: string };
        Update: { created_at?: string; email_domain?: string; id?: string; name?: string };
        Relationships: [];
      };
      item_images: {
        Row: { created_at: string; id: string; image_url: string; item_id: string; position: number };
        Insert: { created_at?: string; id?: string; image_url: string; item_id: string; position?: number };
        Update: { created_at?: string; id?: string; image_url?: string; item_id?: string; position?: number };
        Relationships: [{ foreignKeyName: "item_images_item_id_fkey"; columns: ["item_id"]; isOneToOne: false; referencedRelation: "items"; referencedColumns: ["id"] }];
      };
      items: {
        Row: {
          category_id: string | null; college_id: string | null; created_at: string;
          description: string | null; id: string; location: string; price: number;
          seller_id: string; status: ItemStatus; title: string; updated_at: string;
        };
        Insert: {
          category_id?: string | null; college_id?: string | null; created_at?: string;
          description?: string | null; id?: string; location?: string; price?: number;
          seller_id: string; status?: ItemStatus; title: string; updated_at?: string;
        };
        Update: {
          category_id?: string | null; college_id?: string | null; created_at?: string;
          description?: string | null; id?: string; location?: string; price?: number;
          seller_id?: string; status?: ItemStatus; title?: string; updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: { content: string; created_at: string; id: string; item_id: string; read: boolean; receiver_id: string; sender_id: string };
        Insert: { content: string; created_at?: string; id?: string; item_id: string; read?: boolean; receiver_id: string; sender_id: string };
        Update: { content?: string; created_at?: string; id?: string; item_id?: string; read?: boolean; receiver_id?: string; sender_id?: string };
        Relationships: [];
      };
      profiles: {
        Row: { avatar_url: string | null; college_id: string | null; created_at: string; email: string; full_name: string; id: string; updated_at: string; user_id: string };
        Insert: { avatar_url?: string | null; college_id?: string | null; created_at?: string; email: string; full_name?: string; id?: string; updated_at?: string; user_id: string };
        Update: { avatar_url?: string | null; college_id?: string | null; created_at?: string; email?: string; full_name?: string; id?: string; updated_at?: string; user_id?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { id: string; role: AppRole; user_id: string };
        Insert: { id?: string; role: AppRole; user_id: string };
        Update: { id?: string; role?: AppRole; user_id?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      has_role: { Args: { _role: AppRole; _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      item_status: ItemStatus;
    };
  };
};
