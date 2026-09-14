// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApiSupabase, createMockSupabase } from './supabase';

describe('createMockSupabase', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('persists and retrieves records locally for independent deployment', async () => {
    const client = createMockSupabase();

    await client.from('courses').insert({ id: 'course-1', title: 'Local Course' });

    const { data, error } = await client.from('courses').select('*').eq('id', 'course-1');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({ id: 'course-1', title: 'Local Course' });
  });

  it('uses the Node backend when available', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'api-course', title: 'From API' }],
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = createApiSupabase('http://localhost:5000');
    const { data, error } = await client.from('courses').select('*');

    expect(error).toBeNull();
    expect(data).toHaveLength(1);
    expect(data?.[0]).toMatchObject({ id: 'api-course', title: 'From API' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:5000/api/courses', expect.objectContaining({ method: 'GET' }));
  });
});
