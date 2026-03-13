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

export const FIELD_TYPE_CONFIG: Record<FieldType, { label: string; icon: string; defaultWidth: number; defaultHeight: number }> = {
  signature: { label: "署名", icon: "✍️", defaultWidth: 20, defaultHeight: 5 },
  name:      { label: "氏名", icon: "👤", defaultWidth: 18, defaultHeight: 3.5 },
  company:   { label: "会社名", icon: "🏢", defaultWidth: 22, defaultHeight: 3.5 },
  address:   { label: "住所", icon: "📍", defaultWidth: 30, defaultHeight: 3.5 },
  date:      { label: "日付", icon: "📅", defaultWidth: 14, defaultHeight: 3.5 },
  stamp:     { label: "印影", icon: "🔴", defaultWidth: 6, defaultHeight: 6 },
  text:      { label: "テキスト", icon: "📝", defaultWidth: 20, defaultHeight: 3.5 },
  checkbox:  { label: "チェック", icon: "☑️", defaultWidth: 4, defaultHeight: 4 },
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
