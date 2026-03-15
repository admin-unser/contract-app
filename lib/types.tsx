import React from "react";

export type DocumentStatus = "draft" | "sent" | "completed";

export type DocumentCategory = "業務委託" | "NDA" | "雇用契約" | "売買契約" | "賃貸契約" | "その他";

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "業務委託",
  "NDA",
  "雇用契約",
  "売買契約",
  "賃貸契約",
  "その他",
];

export interface Document {
  id: string;
  owner_id: string;
  file_path: string;
  title: string;
  status: DocumentStatus;
  category: DocumentCategory | null;
  document_hash: string | null;
  chain_hash: string | null;
  template_id: string | null;
  email_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnvelopeSigner {
  id: string;
  document_id: string;
  email: string;
  name: string | null;
  order: number;
  signed_at: string | null;
  signature_data: string | null;
  company_name: string | null;
  otp_verified: boolean;
  signing_token: string;
  created_at: string;
}

export interface DocumentWithSigners extends Document {
  envelope_signers: EnvelopeSigner[];
}

// テンプレートフォルダ
export interface TemplateFolder {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

// テンプレート
export interface Template {
  id: string;
  owner_id: string;
  folder_id: string | null;
  name: string;
  description: string | null;
  file_path: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateWithFolder extends Template {
  template_folders: TemplateFolder | null;
}

// フィールドタイプ
export type FieldType = "signature" | "name" | "company" | "address" | "date" | "stamp" | "text" | "checkbox";

export const FIELD_TYPE_CONFIG: Record<FieldType, { label: string; icon: React.ReactNode; defaultWidth: number; defaultHeight: number }> = {
  signature: {
    label: "署名",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 1 1 3.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
    defaultWidth: 20, defaultHeight: 5,
  },
  name: {
    label: "氏名",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    defaultWidth: 18, defaultHeight: 3.5,
  },
  company: {
    label: "会社名",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      </svg>
    ),
    defaultWidth: 22, defaultHeight: 3.5,
  },
  address: {
    label: "住所",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    defaultWidth: 30, defaultHeight: 3.5,
  },
  date: {
    label: "日付",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    defaultWidth: 14, defaultHeight: 3.5,
  },
  stamp: {
    label: "印影",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <circle cx="12" cy="10" r="6" /><path d="M8 20h8M10 16h4v4H10z" />
      </svg>
    ),
    defaultWidth: 6, defaultHeight: 6,
  },
  text: {
    label: "テキスト",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
      </svg>
    ),
    defaultWidth: 20, defaultHeight: 3.5,
  },
  checkbox: {
    label: "チェック",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    defaultWidth: 4, defaultHeight: 4,
  },
};

// 署名フィールド（PDF上の位置情報、パーセンテージ）
export interface SignatureField {
  id: string;
  document_id: string;
  signer_id: string;
  field_type: FieldType;
  label?: string | null;
  field_value?: string | null;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  created_at: string;
}

// メールテンプレート
export interface EmailTemplate {
  id: string;
  owner_id: string;
  name: string;
  subject: string;
  body_html: string;
  is_default: boolean;
  created_at: string;
}

// OTPトークン
export interface OtpToken {
  id: string;
  signer_id: string;
  code: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
}

// 監査ログ
export type AuditAction =
  | "document_created"
  | "document_sent"
  | "document_viewed"
  | "otp_requested"
  | "otp_verified"
  | "signature_started"
  | "signature_completed"
  | "document_completed"
  | "document_downloaded";

export interface AuditLog {
  id: string;
  document_id: string;
  signer_id: string | null;
  action: AuditAction;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
