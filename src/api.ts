// src/api.ts
export interface Task {
  id: string;
  description: string;
  isCompleted: boolean;
}


const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001';

async function handle<T>(res: Response, expectJson = true): Promise<T | void> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed: ${res.status}`);
  }
  if (!expectJson) return;
  return (await res.json()) as T;
}

export const api = {
  getTasks: async (): Promise<Task[]> => {
    const res = await fetch(`${BASE_URL}/tasks`);
    return (await handle<Task[]>(res))!;
  },
  createTask: async (description: string): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, isCompleted: false }),
    });
    return (await handle<Task>(res))!;
  },
  toggleTask: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'PUT' });
    await handle(res, false);
  },
  deleteTask: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
    await handle(res, false);
  },
};
