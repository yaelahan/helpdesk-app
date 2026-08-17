export type AppRole = "admin" | "agent" | "customer";
export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Ticket {
  id: number;
  user_id: string;
  assigned_to: string | null;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: number;
  ticket_id: number;
  user_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
