export type DocumentStatus = "draft" | "sent" | "completed";

export interface Document {
  id: string;
  owner_id: string;
  file_path: string;
  title: string;
  status: DocumentStatus;
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
  created_at: string;
}

export interface DocumentWithSigners extends Document {
  envelope_signers: EnvelopeSigner[];
}
