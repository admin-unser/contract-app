/**
 * Preset contract templates for MUSUBI sign.
 * These are built-in templates available to all users.
 */

export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string; // SVG path data
  fields: {
    type: string;
    label: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

export const PRESET_CATEGORIES = [
  { id: "employment", name: "人事・雇用", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
  { id: "business", name: "業務委託・請負", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "nda", name: "秘密保持（NDA）", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
  { id: "sales", name: "売買・取引", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
  { id: "lease", name: "賃貸・リース", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "other", name: "その他", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "employment-contract",
    name: "雇用契約書",
    description: "正社員・契約社員向けの標準雇用契約書",
    category: "employment",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2",
    fields: [
      { type: "name", label: "雇用者 氏名", page: 1, x: 15, y: 85, width: 25, height: 4 },
      { type: "signature", label: "雇用者 署名", page: 1, x: 15, y: 90, width: 25, height: 6 },
      { type: "date", label: "雇用者 日付", page: 1, x: 42, y: 85, width: 15, height: 4 },
      { type: "name", label: "被雇用者 氏名", page: 1, x: 60, y: 85, width: 25, height: 4 },
      { type: "signature", label: "被雇用者 署名", page: 1, x: 60, y: 90, width: 25, height: 6 },
      { type: "date", label: "被雇用者 日付", page: 1, x: 87, y: 85, width: 15, height: 4 },
    ],
  },
  {
    id: "nda-bilateral",
    name: "秘密保持契約書（NDA）",
    description: "双方向の秘密保持契約書。取引開始時の標準テンプレート",
    category: "nda",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
    fields: [
      { type: "company", label: "甲 会社名", page: 1, x: 10, y: 85, width: 30, height: 4 },
      { type: "name", label: "甲 代表者名", page: 1, x: 10, y: 90, width: 20, height: 4 },
      { type: "stamp", label: "甲 印", page: 1, x: 32, y: 88, width: 6, height: 6 },
      { type: "company", label: "乙 会社名", page: 1, x: 55, y: 85, width: 30, height: 4 },
      { type: "name", label: "乙 代表者名", page: 1, x: 55, y: 90, width: 20, height: 4 },
      { type: "stamp", label: "乙 印", page: 1, x: 77, y: 88, width: 6, height: 6 },
    ],
  },
  {
    id: "freelance-contract",
    name: "業務委託契約書",
    description: "フリーランス・外部委託向けの業務委託契約書",
    category: "business",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586",
    fields: [
      { type: "company", label: "委託者 会社名", page: 1, x: 10, y: 88, width: 28, height: 4 },
      { type: "name", label: "委託者 氏名", page: 1, x: 10, y: 93, width: 20, height: 4 },
      { type: "signature", label: "委託者 署名", page: 1, x: 32, y: 90, width: 15, height: 6 },
      { type: "company", label: "受託者 会社名", page: 1, x: 55, y: 88, width: 28, height: 4 },
      { type: "name", label: "受託者 氏名", page: 1, x: 55, y: 93, width: 20, height: 4 },
      { type: "signature", label: "受託者 署名", page: 1, x: 77, y: 90, width: 15, height: 6 },
    ],
  },
  {
    id: "onboarding-pledge",
    name: "入社誓約書",
    description: "新入社員向けの入社誓約書・同意書",
    category: "employment",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    fields: [
      { type: "name", label: "氏名", page: 1, x: 20, y: 80, width: 25, height: 4 },
      { type: "address", label: "住所", page: 1, x: 20, y: 85, width: 40, height: 4 },
      { type: "signature", label: "署名", page: 1, x: 20, y: 90, width: 25, height: 6 },
      { type: "date", label: "日付", page: 1, x: 50, y: 90, width: 15, height: 4 },
    ],
  },
  {
    id: "sales-agreement",
    name: "売買契約書",
    description: "物品・サービスの売買契約書",
    category: "sales",
    icon: "M3 3h2l.4 2M7 13h10l4-8H5.4",
    fields: [
      { type: "company", label: "売主 会社名", page: 1, x: 10, y: 85, width: 30, height: 4 },
      { type: "name", label: "売主 代表者", page: 1, x: 10, y: 90, width: 20, height: 4 },
      { type: "stamp", label: "売主 印", page: 1, x: 32, y: 88, width: 6, height: 6 },
      { type: "company", label: "買主 会社名", page: 1, x: 55, y: 85, width: 30, height: 4 },
      { type: "name", label: "買主 代表者", page: 1, x: 55, y: 90, width: 20, height: 4 },
      { type: "stamp", label: "買主 印", page: 1, x: 77, y: 88, width: 6, height: 6 },
    ],
  },
  {
    id: "lease-agreement",
    name: "賃貸借契約書",
    description: "不動産・設備の賃貸借契約書",
    category: "lease",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3",
    fields: [
      { type: "company", label: "賃貸人", page: 1, x: 10, y: 88, width: 28, height: 4 },
      { type: "signature", label: "賃貸人 署名", page: 1, x: 10, y: 93, width: 20, height: 6 },
      { type: "company", label: "賃借人", page: 1, x: 55, y: 88, width: 28, height: 4 },
      { type: "signature", label: "賃借人 署名", page: 1, x: 55, y: 93, width: 20, height: 6 },
    ],
  },
  {
    id: "consulting-agreement",
    name: "コンサルティング契約書",
    description: "コンサルティング業務の委託契約書",
    category: "business",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    fields: [
      { type: "company", label: "委託者", page: 1, x: 10, y: 88, width: 28, height: 4 },
      { type: "name", label: "委託者 代表者", page: 1, x: 10, y: 93, width: 20, height: 4 },
      { type: "stamp", label: "委託者 印", page: 1, x: 32, y: 90, width: 6, height: 6 },
      { type: "company", label: "受託者", page: 1, x: 55, y: 88, width: 28, height: 4 },
      { type: "name", label: "受託者 代表者", page: 1, x: 55, y: 93, width: 20, height: 4 },
      { type: "stamp", label: "受託者 印", page: 1, x: 77, y: 90, width: 6, height: 6 },
    ],
  },
  {
    id: "non-compete",
    name: "競業避止契約書",
    description: "退職時の競業避止義務に関する契約書",
    category: "employment",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    fields: [
      { type: "name", label: "氏名", page: 1, x: 20, y: 85, width: 25, height: 4 },
      { type: "signature", label: "署名", page: 1, x: 20, y: 90, width: 25, height: 6 },
      { type: "date", label: "日付", page: 1, x: 50, y: 90, width: 15, height: 4 },
    ],
  },
];

export function getPresetsByCategory(categoryId: string): PresetTemplate[] {
  return PRESET_TEMPLATES.filter((t) => t.category === categoryId);
}
