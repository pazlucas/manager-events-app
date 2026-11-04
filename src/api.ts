const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export type EventStatus = 'open' | 'closed';

export interface EventItem {
  id: number;
  name: string;
  description: string | null;
  event_date: string | null;
  status: EventStatus;
  created_at: string;
  closed_at: string | null;
  member_count: number;
  expense_count: number;
  total_amount: number;
}

export interface Member {
  id: number;
  event_id: number;
  name: string;
  email: string | null;
  total_paid: number;
}

export interface Payment {
  id: number;
  expense_id: number;
  member_id: number;
  member_name: string;
  amount: number;
}

export interface Expense {
  id: number;
  event_id: number;
  description: string;
  amount: number;
  created_by_id: number | null;
  created_by_name: string | null;
  paid_amount: number;
  pending_amount: number;
  is_covered: boolean;
  payments: Payment[];
}

export interface Balance {
  member_id: number;
  member_name: string;
  paid: number;
  share: number;
  balance: number;
}

export interface Transfer {
  from_member_id: number;
  from_member_name: string;
  to_member_id: number;
  to_member_name: string;
  amount: number;
}

export interface Summary {
  event_id: number;
  kind: 'preview' | 'final';
  total_amount: number;
  member_count: number;
  share_amount: number;
  is_balanced: boolean;
  pending_expenses: { id: number; description: string; pending_amount: number }[];
  balances: Balance[];
  transfers: Transfer[];
  created_at: string | null;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, `No se pudo conectar con la API (${BASE_URL})`);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d: { msg: string }) => d.msg).join('\n')
      : (detail ?? `Error ${res.status}`);
    throw new ApiError(res.status, message);
  }
  return data as T;
}

type EventInput = { name: string; description?: string | null; event_date?: string | null };
type MemberInput = { name: string; email?: string | null };
type ExpenseInput = { description: string; amount: number; created_by_id?: number | null };
type PaymentInput = { member_id: number; amount: number };

export const api = {
  events: {
    list: () => request<EventItem[]>('GET', '/events'),
    get: (id: number) => request<EventItem>('GET', `/events/${id}`),
    create: (data: EventInput) => request<EventItem>('POST', '/events', data),
    update: (id: number, data: Partial<EventInput>) => request<EventItem>('PATCH', `/events/${id}`, data),
    remove: (id: number) => request<void>('DELETE', `/events/${id}`),
    summary: (id: number) => request<Summary>('GET', `/events/${id}/summary`),
    close: (id: number) => request<Summary>('POST', `/events/${id}/close`),
    reopen: (id: number) => request<EventItem>('POST', `/events/${id}/reopen`),
  },
  members: {
    list: (eventId: number) => request<Member[]>('GET', `/events/${eventId}/members`),
    get: (id: number) => request<Member>('GET', `/members/${id}`),
    create: (eventId: number, data: MemberInput) => request<Member>('POST', `/events/${eventId}/members`, data),
    update: (id: number, data: Partial<MemberInput>) => request<Member>('PATCH', `/members/${id}`, data),
    remove: (id: number) => request<void>('DELETE', `/members/${id}`),
  },
  expenses: {
    list: (eventId: number) => request<Expense[]>('GET', `/events/${eventId}/expenses`),
    get: (id: number) => request<Expense>('GET', `/expenses/${id}`),
    create: (eventId: number, data: ExpenseInput) => request<Expense>('POST', `/events/${eventId}/expenses`, data),
    update: (id: number, data: Partial<ExpenseInput>) => request<Expense>('PATCH', `/expenses/${id}`, data),
    remove: (id: number) => request<void>('DELETE', `/expenses/${id}`),
  },
  payments: {
    get: (id: number) => request<Payment>('GET', `/payments/${id}`),
    create: (expenseId: number, data: PaymentInput) => request<Payment>('POST', `/expenses/${expenseId}/payments`, data),
    update: (id: number, data: Partial<PaymentInput>) => request<Payment>('PATCH', `/payments/${id}`, data),
    remove: (id: number) => request<void>('DELETE', `/payments/${id}`),
  },
};
