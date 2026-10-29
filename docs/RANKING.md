# Ranking online con Supabase

Mientras `src/config.js` esté vacío, el ranking muestra solo las partidas jugadas en cada dispositivo. Para que tus amigos compartan un mismo ranking, conectá un proyecto gratuito de Supabase.

## 1. Crear el proyecto

1. Entrá a <https://supabase.com/dashboard> y tocá **New project**.
2. Nombre: `zaks-throne`. Elegí una contraseña de base de datos (guardala; el juego no la usa) y la región más cercana, por ejemplo **South America (São Paulo)**.
3. Esperá uno o dos minutos a que termine de crearse.

## 2. Crear la tabla

En el menú izquierdo abrí **SQL Editor**, pegá esto y tocá **Run**:

```sql
create table if not exists public.scores (
  run_id     text primary key check (char_length(run_id) between 6 and 64),
  player_id  text not null check (char_length(player_id) between 6 and 64),
  name       text not null check (char_length(name) between 1 and 16),
  character  text not null check (character in ('gero','paco','fede','pepe','tena','dante')),
  level      int  not null check (level between 1 and 500),
  kills      int  not null check (kills between 0 and 100000),
  bosses     int  not null check (bosses between 0 and 10000),
  play_time  int  not null default 0 check (play_time between 0 and 10000000),
  updated_at timestamptz not null default now()
);

alter table public.scores enable row level security;

drop policy if exists "ranking: leer" on public.scores;
drop policy if exists "ranking: crear" on public.scores;
drop policy if exists "ranking: actualizar" on public.scores;
drop policy if exists "ranking: borrar" on public.scores;
create policy "ranking: leer" on public.scores for select to anon using (true);
create policy "ranking: crear" on public.scores for insert to anon with check (true);
create policy "ranking: actualizar" on public.scores for update to anon using (true) with check (true);
create policy "ranking: borrar" on public.scores for delete to anon using (true);

grant select, insert, update, delete on public.scores to anon;
```

El permiso de borrar se usa cuando alguien borra una partida guardada: el juego quita esa partida del ranking. También podés limpiar filas a mano en **Table Editor → scores**.

### Si ya habías creado la tabla antes

Corré solo esto en **SQL Editor** para habilitar el borrado:

```sql
drop policy if exists "ranking: borrar" on public.scores;
create policy "ranking: borrar" on public.scores for delete to anon using (true);
grant delete on public.scores to anon;
```

## 3. Copiar la URL y la clave pública

En **Project Settings → API** (o **Connect**) copiá:

- **Project URL**: algo como `https://abcdxyz.supabase.co`
- **Publishable key** (`sb_publishable_…`) o, en proyectos antiguos, la **anon public** key (`eyJ…`).

**Nunca** uses la `secret` ni la `service_role`.

## 4. Pegarlas en el juego

Editá `src/config.js`:

```js
window.ZAK_CONFIG = {
  supabaseUrl: 'https://abcdxyz.supabase.co',
  supabaseKey: 'sb_publishable_...',
  table: 'scores'
};
```

Subí el cambio a GitHub. Con GitHub Pages activo, en uno o dos minutos todos tus amigos comparten el ranking.

## Cómo funciona

- Cada partida nueva tiene su propia fila. Se actualiza al subir de nivel, al derrotar un jefe, cada 5 enemigos y al guardar.
- El apodo es obligatorio: se escribe en la pantalla de personajes y queda recordado en ese dispositivo.
- Al borrar una ranura guardada, esa partida también sale del ranking (salvo que siga guardada en otra ranura). Si no hay conexión, el borrado se reintenta más tarde.
- Si no hay conexión, el juego sigue normalmente y muestra las partidas locales.

## Límites

La clave pública está pensada para ir en páginas web, y la tabla solo acepta valores dentro de rangos razonables. Aun así, alguien con conocimientos técnicos podría enviar un puntaje inventado, pisar o borrar una fila ajena. Para un ranking entre amigos alcanza. Si se vuelve competitivo en serio, haría falta validar los puntajes en un servidor.
