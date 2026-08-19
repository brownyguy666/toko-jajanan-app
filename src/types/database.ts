export type UserRole = "owner" | "pegawai";
export type PaymentMethod = "tunai" | "qris" | "transfer";
export type ExpenseCategory = "bahan baku" | "gas" | "kemasan" | "sewa" | "lainnya";

export interface Profile {
  id: string; // references auth.users.id
  nama: string;
  email: string;
  role: UserRole;
  status_aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Produk {
  id: string;
  nama: string;
  kategori: string;
  harga_jual: number;
  harga_modal: number;
  stok: number;
  foto_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Transaksi {
  id: string;
  kasir_id: string;
  tanggal: string;
  total: number;
  metode_bayar: PaymentMethod;
  created_at?: string;
  kasir?: Profile;
  items?: TransaksiItem[];
}

export interface TransaksiItem {
  id: string;
  transaksi_id: string;
  produk_id: string;
  qty: number;
  harga_saat_jual: number;
  subtotal: number;
  created_at?: string;
  produk?: Produk;
}

export interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: ExpenseCategory;
  jumlah: number;
  keterangan: string | null;
  created_at?: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          nama: string;
          email: string;
          role: UserRole;
          status_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          email?: string;
          role?: UserRole;
          status_aktif?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      produk: {
        Row: Produk;
        Insert: {
          id?: string;
          nama: string;
          kategori: string;
          harga_jual: number;
          harga_modal: number;
          stok?: number;
          foto_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          kategori?: string;
          harga_jual?: number;
          harga_modal?: number;
          stok?: number;
          foto_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transaksi: {
        Row: Transaksi;
        Insert: {
          id?: string;
          kasir_id: string;
          tanggal?: string;
          total: number;
          metode_bayar: PaymentMethod;
          created_at?: string;
        };
        Update: {
          id?: string;
          kasir_id?: string;
          tanggal?: string;
          total?: number;
          metode_bayar?: PaymentMethod;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaksi_kasir_id_fkey";
            columns: ["kasir_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      transaksi_item: {
        Row: TransaksiItem;
        Insert: {
          id?: string;
          transaksi_id: string;
          produk_id: string;
          qty: number;
          harga_saat_jual: number;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaksi_id?: string;
          produk_id?: string;
          qty?: number;
          harga_saat_jual?: number;
          subtotal?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaksi_item_transaksi_id_fkey";
            columns: ["transaksi_id"];
            isOneToOne: false;
            referencedRelation: "transaksi";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaksi_item_produk_id_fkey";
            columns: ["produk_id"];
            isOneToOne: false;
            referencedRelation: "produk";
            referencedColumns: ["id"];
          }
        ];
      };
      pengeluaran: {
        Row: Pengeluaran;
        Insert: {
          id?: string;
          tanggal?: string;
          kategori: ExpenseCategory;
          jumlah: number;
          keterangan?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tanggal?: string;
          kategori?: ExpenseCategory;
          jumlah?: number;
          keterangan?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_owner: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

