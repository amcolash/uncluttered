export interface Category {
  key: string;
  description: string;
  urgency: number;
}

export interface Email {
  id: string;
  threadId: string;
  sender: string;
  subject: string;
  snippet: string;
  aiCategory: string;
  userOverrideCategory: string | null;
  isArchived: boolean;
  processedAt: string;
  validated: boolean;
}

export interface DbSchema {
  categories: Category[];
  emails: Email[];
}
