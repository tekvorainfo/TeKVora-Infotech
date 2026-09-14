import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const nodeApiBaseUrl = import.meta.env.VITE_NODE_API_URL ?? '';

const STORAGE_KEY = 'tekvora-local-supabase-data';
const SESSION_KEY = 'tekvora-api-session';

const readLocalStore = () => {
  if (typeof window === 'undefined') return {} as Record<string, any[]>;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeLocalStore = (store: Record<string, any[]>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

const readSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeSession = (session: any) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const removeSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
};

const resolveTablePath = (table: string) => {
  switch (table) {
    case 'job_postings':
      return 'jobs';
    case 'contact_submissions':
      return 'contact';
    case 'scheduled_classes':
      return 'scheduled_classes';
    default:
      return table;
  }
};

const normalizePayload = (table: string, payload: any) => {
  if (table === 'contact_submissions') {
    return {
      name: payload.full_name || payload.name || '',
      email: payload.email || '',
      phone: payload.phone || '',
      message: payload.message || '',
    };
  }

  return payload;
};

const normalizeData = (table: string, data: any) => {
  if (!data) return data;

  const normalizeItem = (item: any) => {
    if (table === 'courses') {
      const skills = typeof item.skills === 'string'
        ? item.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean)
        : Array.isArray(item.skills)
          ? item.skills
          : [];

      return {
        ...item,
        skills,
        created_at: item.created_at || item.createdAt || '',
        certificate_eligible: item.certificate_eligible ?? item.certificateEligible ?? true,
      };
    }

    if (table === 'internships') {
      const skills = typeof item.skills === 'string'
        ? item.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean)
        : Array.isArray(item.skills)
          ? item.skills
          : [];

      return {
        ...item,
        skills,
        created_at: item.created_at || item.createdAt || '',
        certificate: item.certificate ?? true,
      };
    }

    if (table === 'jobs') {
      const skills = typeof item.skills === 'string'
        ? item.skills.split(',').map((skill: string) => skill.trim()).filter(Boolean)
        : Array.isArray(item.skills)
          ? item.skills
          : [];

      return {
        ...item,
        id: item.id,
        role: item.role || item.title || '',
        company: item.company || '',
        location: item.location || '',
        type: item.type || 'Full-time',
        remote: item.remote || 'Remote',
        salary: item.salary || 'Not disclosed',
        skills,
        description: item.description || '',
        created_at: item.created_at || item.createdAt || '',
      };
    }

    return item;
  };

  if (Array.isArray(data)) {
    return data.map(normalizeItem);
  }

  return normalizeItem(data);
};

const createLocalEntry = (table: string, payload: any) => {
  const nextStore = readLocalStore();
  const records = [...(nextStore[table] ?? [])];
  const row = Array.isArray(payload) ? payload : [payload];
  // Ensure every row has a generated id and created_at
  const enriched = row.map(r => ({
    id: r.id ?? `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: r.created_at ?? new Date().toISOString(),
    ...r,
  }));
  records.push(...enriched);
  nextStore[table] = records;
  writeLocalStore(nextStore);
  return enriched;
};

export const createMockSupabase = () => {
  console.warn('Supabase environment variables are missing. Using browser-local fallback storage.');

  const createQueryBuilder = (table: string) => {
    // Track eq filters for delete/update operations
    const eqFilters: { column: string; value: any }[] = [];

    // Re-reads from localStorage each time so inserts are immediately visible
    const getTableData = () => {
      const store = readLocalStore();
      return store[table] ?? [];
    };

    const buildResult = (data?: any[]) => ({ data: data ?? getTableData(), error: null });

    const chain: any = {
      select: () => chain,
      eq: (column: string, value: any) => { eqFilters.push({ column, value }); return chain; },
      neq: (_column: string, _value: any) => chain,
      gt: (_column: string, _value: any) => chain,
      gte: (_column: string, _value: any) => chain,
      lt: (_column: string, _value: any) => chain,
      lte: (_column: string, _value: any) => chain,
      like: (_column: string, _value: any) => chain,
      ilike: (_column: string, _value: any) => chain,
      is: (_column: string, _value: any) => chain,
      in: (_column: string, _value: any) => chain,
      contains: (_column: string, _value: any) => chain,
      containedBy: (_column: string, _value: any) => chain,
      range: (_column: string, _value: any) => chain,
      or: (_column: string, _value: any) => chain,
      order: (_column: string, _opts: any) => chain,
      limit: (_count: number) => chain,
      rangeAdjacent: (_column: string, _value: any) => chain,
      maybeSingle: async () => {
        let rows = getTableData();
        for (const f of eqFilters) {
          rows = rows.filter((r: any) => r[f.column] === f.value);
        }
        return { data: rows[0] ?? null, error: null };
      },
      single: async () => {
        let rows = getTableData();
        for (const f of eqFilters) {
          rows = rows.filter((r: any) => r[f.column] === f.value);
        }
        return { data: rows[0] ?? null, error: null };
      },
      insert: async (payload: any) => {
        const enriched = createLocalEntry(table, payload);
        return buildResult(enriched);
      },
      update: async (payload: any) => {
        const store = readLocalStore();
        const records: any[] = store[table] ?? [];
        const updated = records.map((r: any) => {
          const matches = eqFilters.every(f => r[f.column] === f.value);
          return matches ? { ...r, ...payload } : r;
        });
        store[table] = updated;
        writeLocalStore(store);
        return { data: updated, error: null };
      },
      delete: async () => {
        const store = readLocalStore();
        let records: any[] = store[table] ?? [];
        for (const f of eqFilters) {
          records = records.filter((r: any) => r[f.column] !== f.value);
        }
        store[table] = records;
        writeLocalStore(store);
        return { data: [], error: null };
      },
      then: (resolve: any) => Promise.resolve(buildResult()).then(resolve),
    };

    return new Proxy(chain, {
      get(target, prop) {
        if (prop in target) return target[prop as keyof typeof target];
        return () => target;
      }
    });
  };

  const selectFromTable = async (table: string) => {
    const store = readLocalStore();
    return { data: store[table] ?? [], error: null };
  };

  return {
    from: (table: string) => createQueryBuilder(table),
    auth: {
      onAuthStateChange: (cb: any) => {
        const session = readSession();
        queueMicrotask(() => cb('SIGNED_OUT', session));
        return { data: { subscription: { unsubscribe: () => { } } } };
      },
      getUser: async () => ({ data: { user: readSession()?.user ?? null }, error: null }),
      getSession: async () => ({ data: { session: readSession() }, error: null }),
      signInWithPassword: async (credentials: { email: string; password: string }) => {
        const userId = `local-stu-${credentials.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const user = { id: userId, email: credentials.email };
        const session = { user, access_token: 'local-token' };
        writeSession(session);

        const store = readLocalStore();
        const profiles = store['student_profiles'] ?? [];
        if (!profiles.some((p: any) => p.email === credentials.email)) {
          profiles.push({
            id: user.id,
            student_id: `TVR-STU-${Math.floor(10000 + Math.random() * 90000)}`,
            full_name: credentials.email.split('@')[0],
            email: credentials.email,
            phone: '',
            is_active: true,
            created_at: new Date().toISOString(),
          });
          store['student_profiles'] = profiles;
          writeLocalStore(store);
        }

        return { data: { user, session }, error: null };
      },
      signUp: async (credentials: { email: string; password: string }) => {
        const userId = `local-stu-${credentials.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const user = { id: userId, email: credentials.email };
        const session = { user, access_token: 'local-token' };
        writeSession(session);
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        removeSession();
        return { error: null };
      },
      updateUser: async () => ({ data: { user: readSession()?.user ?? null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: '' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    functions: {
      invoke: async (fnName: string) => ({
        data: null,
        error: { message: `Edge function '${fnName}' requires Supabase production environment. Not available on localhost mock.` },
      }),
    },
    __internal: {
      selectFromTable,
    },
  } as any;
};

export const createApiSupabase = (baseUrl = nodeApiBaseUrl) => {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  const request = async (table: string, method: string, payload?: any) => {
    const endpoint = `${baseUrl}/api/${resolveTablePath(table)}`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: jsonHeaders,
        body: payload ? JSON.stringify(normalizePayload(table, payload)) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `Request failed with ${response.status}`);
      }

      const contentType = response.headers?.get?.('content-type') || '';
      const body = contentType.includes('application/json') || typeof response.json === 'function'
        ? await response.json()
        : await response.text();
      return normalizeData(table, body);
    } catch {
      if (method === 'GET') {
        const store = readLocalStore();
        return normalizeData(table, store[table] ?? []);
      }
      if (method === 'POST') {
        return createLocalEntry(table, payload);
      }
      return [];
    }
  };

  const createQueryBuilder = (table: string) => {
    const chain = {
      select: () => chain,
      eq: (_column: string, value: any) => chain,
      neq: (_column: string, value: any) => chain,
      gt: (_column: string, value: any) => chain,
      gte: (_column: string, value: any) => chain,
      lt: (_column: string, value: any) => chain,
      lte: (_column: string, value: any) => chain,
      like: (_column: string, value: any) => chain,
      ilike: (_column: string, value: any) => chain,
      is: (_column: string, value: any) => chain,
      in: (_column: string, value: any) => chain,
      contains: (_column: string, value: any) => chain,
      containedBy: (_column: string, value: any) => chain,
      range: (_column: string, value: any) => chain,
      or: (_column: string, value: any) => chain,
      order: (_column: string, value: any) => chain,
      limit: (_count: number) => chain,
      rangeAdjacent: (_column: string, value: any) => chain,
      maybeSingle: async () => {
        const data = await request(table, 'GET');
        return { data: Array.isArray(data) ? data[0] ?? null : data, error: null };
      },
      single: async () => {
        const data = await request(table, 'GET');
        return { data: Array.isArray(data) ? data[0] ?? null : data, error: null };
      },
      insert: async (payload: any) => {
        const data = await request(table, 'POST', payload);
        return { data, error: null };
      },
      update: async (payload: any) => {
        const data = await request(table, 'PATCH', payload);
        return { data, error: null };
      },
      delete: async () => ({ data: [], error: null }),
      then: (resolve: any, reject?: any) => request(table, 'GET').then((data) => resolve({ data, error: null })).catch(reject ?? (() => { })),
    };

    return new Proxy(chain, {
      get(target, prop) {
        if (prop in target) return target[prop as keyof typeof target];
        return () => target;
      }
    });
  };

  return {
    from: (table: string) => createQueryBuilder(table),
    auth: {
      onAuthStateChange: (cb: any) => {
        const session = readSession();
        queueMicrotask(() => cb('INITIAL_SESSION', session));
        return { data: { subscription: { unsubscribe: () => { } } } };
      },
      getUser: async () => ({ data: { user: readSession()?.user ?? null }, error: null }),
      getSession: async () => ({ data: { session: readSession() }, error: null }),
      signInWithPassword: async (credentials: { email: string; password: string }) => {
        const response = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        if (!response.ok) {
          return { data: null, error: data };
        }
        const session = { access_token: data.token, user: data.user };
        writeSession(session);
        return { data: { user: data.user, session }, error: null };
      },
      signUp: async (credentials: { email: string; password: string }) => {
        const response = await fetch(`${baseUrl}/api/auth/register`, {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        if (!response.ok) {
          return { data: null, error: data };
        }
        const session = { access_token: data.token, user: data.user };
        writeSession(session);
        return { data: { user: data.user, session }, error: null };
      },
      signOut: async () => {
        removeSession();
        return { error: null };
      },
      updateUser: async () => ({ data: { user: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: '' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
    functions: {
      invoke: async (fnName: string) => ({
        data: null,
        error: { message: `Edge function '${fnName}' requires Supabase production environment. Connect to Supabase to use this feature.` },
      }),
    },
  } as any;
};

const useApiClient = typeof window !== 'undefined' && window.location.hostname === 'localhost' && Boolean(nodeApiBaseUrl);

export const supabase = (supabaseUrl && supabaseAnonKey && !useApiClient)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (useApiClient ? createApiSupabase() : createMockSupabase());
