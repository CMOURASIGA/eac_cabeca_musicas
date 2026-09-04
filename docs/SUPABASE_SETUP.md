# Ligando o app ao Supabase (niagdoowqmngxjcrmstd)

Passo a passo para sair do modo demonstração e usar persistência real.
Nada aqui apaga o que já existe no projeto — as migrations só criam
tabelas/tipos/políticas novos, com nomes prefixados `eac_`.

## 1. Rodar as migrations

No painel do projeto → **SQL Editor** → New query. Cole e rode, **nesta
ordem**, o conteúdo de cada arquivo:

1. `supabase/migrations/0001_init_livro_musicas_eac.sql`
2. `supabase/migrations/0002_seed_categories.sql`

Cada um está em uma transação (`begin`/`commit`): se algo falhar no meio
(por exemplo, um nome já existir por outro motivo no seu projeto), nada
daquele arquivo fica aplicado — me avise qual foi o erro antes de tentar
de novo, não rode com `force`.

> Se você já tentou rodar a `0001` e bateu no erro `42P17: generation
> expression is not immutable`: era a coluna gerada `search_text` usando
> `unaccent()` (não é IMMUTABLE). Já corrigido — puxe a versão mais nova
> do arquivo (agora usa um trigger em vez de coluna gerada) e rode de
> novo. Como a migration inteira roda numa transação, o erro anterior não
> deixou nada aplicado — pode rodar limpo.

Se preferir usar a Supabase CLI em vez do SQL Editor:

```bash
supabase link --project-ref niagdoowqmngxjcrmstd
supabase db push
```

## 2. Pegar as chaves do projeto

Painel → **Project Settings → API**:

- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Copie `.env.example` para `.env.local` e preencha as duas variáveis (ou
configure-as direto na plataforma de deploy). Nenhuma outra chave é
necessária — o app nunca usa a `service_role` key, todas as operações do
painel administrativo passam pela sessão do usuário logado + RLS.

## 3. Desligar o cadastro público de contas

Este app não tem cadastro público — só Editor/Admin autenticam, e quem
cria a conta é o Admin. No painel:

**Authentication → Providers → Email** → desmarque "Allow new users to
sign up" (ou equivalente na versão do seu painel). Sem isso, qualquer
pessoa poderia criar uma conta sozinha e, pelo trigger da migration, ela
entraria automaticamente como `EDITOR`.

## 4. Criar o primeiro usuário (Admin)

**Authentication → Users → Add user** (defina e-mail e senha, ou envie
convite). Depois, no SQL Editor, promova essa conta a `ADMIN` (todo
usuário novo entra como `EDITOR` por padrão):

```sql
update public.eac_profiles
set role = 'ADMIN'
where id = '<uuid do usuário, copiado da lista de Users>';
```

## 5. Validar

1. Rode `npm run build` (ou `npm run dev`) com as variáveis de ambiente
   preenchidas.
2. Acesse `/admin/login`, entre com o usuário criado no passo 4.
3. `/admin/musicas` deve carregar (vazio, ainda sem músicas).
4. `/admin/importar` → suba um `.txt` de teste, revise o preview e
   processe o lote.
5. A música publicada deve aparecer em `/livro-eac` (ou `/missa`) e em
   `/musica/<slug>` sem estar logado (aba anônima) — é a RLS pública
   funcionando.

## 6. Carregar as 41 músicas reais

Assim que os 41 `.txt` originais estiverem disponíveis, suba-os em lote
em `/admin/importar`. O parser já foi desenvolvido e testado (front
matter opcional, TXT legado sem front matter, detecção de título/tom/
acordes) — ver `docs/STATUS_FRONTEND.md` e `lib/parseSongTxt.ts`.
