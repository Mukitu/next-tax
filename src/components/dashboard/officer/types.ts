export type TaxRequestStatus = "submitted" | "approved" | "rejected";

export type TaxRequestRow = {
  id: string;
  citizen_id: string;
  fiscal_year: string;
  total_income: number;
  total_expense: number;
  taxable_income: number;
  calculated_tax: number;
  calculation_data: any;
  status: TaxRequestStatus;
  officer_id: string | null;
  officer_note: string | null;
  created_at: string;
  updated_at: string;
};

export type OfficerActivityLogRow = {
  id: string;
  officer_id: string;
  activity_type: string;
  target_user_id: string | null;
  description: string;
  metadata: any;
  created_at: string;
};
