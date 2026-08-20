// Edge Function called by the personal Shortcut to insert a transaction.
//
// Auth model: this function is invoked with the project's anon key (required
// by Supabase's edge runtime to accept the request at all) plus a separate
// shared secret in the `x-shortcut-secret` header that only the Shortcut
// knows. The secret is checked before anything else runs. Once verified, the
// function writes using the service-role key (bypasses RLS) on behalf of a
// single fixed user — this app has exactly one user (APP_USER_ID), so there
// is no per-request identity to look up.
//
// Required secrets (set with `supabase secrets set NAME=value`):
//   SHORTCUT_SECRET      - shared secret the Shortcut must send
//   APP_USER_ID           - the auth.users.id this app belongs to
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Request body (JSON):
//   {
//     "type": "gasto" | "ingreso" | "transferencia",
//     "account": "Nombre de la cuenta",
//     "amount": 123.45,
//     "category": "Nombre de la categoría",   // requerido para gasto/ingreso
//     "transfer_account": "Nombre destino",    // requerido para transferencia
//     "note": "texto opcional",                // alias aceptado: "description"
//     "date": "2026-08-20"                     // opcional, default hoy; también acepta
//   }                                           // un datetime ISO completo (se recorta a la fecha)

import { createClient } from 'npm:@supabase/supabase-js@2'

const TYPE_MAP: Record<string, 'income' | 'expense' | 'transfer'> = {
  gasto: 'expense',
  ingreso: 'income',
  transferencia: 'transfer',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const shortcutSecret = Deno.env.get('SHORTCUT_SECRET')
  const appUserId = Deno.env.get('APP_USER_ID')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!shortcutSecret || !appUserId || !supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Function is misconfigured (missing secrets)' }, 500)
  }

  if (req.headers.get('x-shortcut-secret') !== shortcutSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let payload: {
    type?: string
    account?: string
    amount?: number
    category?: string
    transfer_account?: string
    note?: string
    description?: string
    date?: string
  }
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const type = TYPE_MAP[(payload.type ?? '').trim().toLowerCase()]
  if (!type) {
    return jsonResponse({ error: `type debe ser uno de: ${Object.keys(TYPE_MAP).join(', ')}` }, 400)
  }

  const amount = Number(payload.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonResponse({ error: 'amount debe ser un número mayor a 0' }, 400)
  }

  const accountName = (payload.account ?? '').trim()
  if (!accountName) {
    return jsonResponse({ error: 'account es requerido' }, 400)
  }

  if (type === 'transfer' && !(payload.transfer_account ?? '').trim()) {
    return jsonResponse({ error: 'transfer_account es requerido para transferencias' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', appUserId)

  if (accountsError) {
    return jsonResponse({ error: `Error leyendo cuentas: ${accountsError.message}` }, 500)
  }

  function findAccountId(name: string): string | null {
    const match = accounts?.find((a) => a.name.toLowerCase() === name.trim().toLowerCase())
    return match?.id ?? null
  }

  const accountId = findAccountId(accountName)
  if (!accountId) {
    return jsonResponse(
      { error: `No encontré la cuenta "${accountName}". Cuentas disponibles: ${accounts?.map((a) => a.name).join(', ')}` },
      400,
    )
  }

  let transferAccountId: string | null = null
  if (type === 'transfer') {
    const transferAccountName = (payload.transfer_account ?? '').trim()
    transferAccountId = findAccountId(transferAccountName)
    if (!transferAccountId) {
      return jsonResponse(
        { error: `No encontré la cuenta destino "${transferAccountName}". Cuentas disponibles: ${accounts?.map((a) => a.name).join(', ')}` },
        400,
      )
    }
    if (transferAccountId === accountId) {
      return jsonResponse({ error: 'La cuenta origen y destino no pueden ser la misma' }, 400)
    }
  }

  let categoryId: string | null = null
  const categoryName = (payload.category ?? '').trim()
  if (type !== 'transfer' && categoryName) {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', appUserId)

    if (categoriesError) {
      return jsonResponse({ error: `Error leyendo categorías: ${categoriesError.message}` }, 500)
    }

    const match = categories?.find((c) => c.name.toLowerCase() === categoryName.toLowerCase())
    if (!match) {
      return jsonResponse(
        { error: `No encontré la categoría "${categoryName}". Categorías disponibles: ${categories?.map((c) => c.name).join(', ')}` },
        400,
      )
    }
    categoryId = match.id
  }

  const { data: inserted, error: insertError } = await supabase
    .from('transactions')
    .insert({
      user_id: appUserId,
      account_id: accountId,
      transfer_account_id: transferAccountId,
      category_id: categoryId,
      amount,
      type,
      date: payload.date?.trim().slice(0, 10) || new Date().toISOString().slice(0, 10),
      note: (payload.note ?? payload.description)?.trim() || null,
    })
    .select()
    .single()

  if (insertError) {
    return jsonResponse({ error: `Error insertando: ${insertError.message}` }, 500)
  }

  return jsonResponse({ ok: true, transaction: inserted }, 200)
})
