# Partidas en la nube

Con una cuenta (mail y contraseña), las tres ranuras se sincronizan solas entre todos tus dispositivos. Usa el mismo proyecto de Supabase del ranking ([docs/RANKING.md](RANKING.md)). Hay que prepararlo una sola vez.

Mientras no lo prepares, el juego sigue funcionando igual: guarda en el dispositivo, y la pantalla **Cuenta y nube** avisa que falta este paso.

## 1. Crear la tabla

En Supabase abrí **SQL Editor**, pegá esto y tocá **Run**:

```sql
create table if not exists public.cloud_saves (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slot       smallint not null check (slot between 1 and 3),
  saved_at   text not null check (char_length(saved_at) between 1 and 40),
  data       jsonb not null check (pg_column_size(data) < 2000000),
  updated_at timestamptz not null default now(),
  primary key (user_id, slot)
);

alter table public.cloud_saves enable row level security;

drop policy if exists "nube: leer las propias" on public.cloud_saves;
drop policy if exists "nube: crear las propias" on public.cloud_saves;
drop policy if exists "nube: actualizar las propias" on public.cloud_saves;
drop policy if exists "nube: borrar las propias" on public.cloud_saves;
create policy "nube: leer las propias" on public.cloud_saves for select to authenticated using (auth.uid() = user_id);
create policy "nube: crear las propias" on public.cloud_saves for insert to authenticated with check (auth.uid() = user_id);
create policy "nube: actualizar las propias" on public.cloud_saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "nube: borrar las propias" on public.cloud_saves for delete to authenticated using (auth.uid() = user_id);

revoke all on public.cloud_saves from anon;
grant select, insert, update, delete on public.cloud_saves to authenticated;
```

Las políticas son lo que hace que cada persona solo pueda leer, cambiar o borrar **sus** partidas. Quien no tiene sesión no accede a nada.

## 2. Configurar las cuentas

En **Authentication → Sign In / Providers → Email**:

- Dejá **Email** activado.
- **Confirm email:** recomiendo desactivarlo. Con la configuración de correo gratuita de Supabase se envían muy pocos mails por hora, así que varios amigos creando cuenta a la vez se quedarían esperando. El juego funciona de las dos formas. A cambio, sin confirmación se puede crear una cuenta con un mail ajeno.

En **Authentication → URL Configuration**:

- **Site URL:** la dirección del juego (por ejemplo, `https://danteromero.github.io/Zak-s-Throne/`).
- **Redirect URLs:** la misma dirección. Si no está, el link de "Olvidé mi contraseña" no vuelve al juego.

Si más adelante cambiás la dirección del juego (por ejemplo, a Cloudflare), actualizá estos dos valores.

## 3. Publicar

Subí el juego a GitHub como siempre. No hay claves nuevas: usa las de `src/config.js`.

## Cómo funciona

- **Primero el dispositivo:** cada guardado queda en el navegador y después se sube. Sin conexión el juego sigue normal y sincroniza cuando vuelve.
- **Cuándo sincroniza:** al abrir el juego o volver a él, al abrir **Cargar juego**, al guardar y al borrar. No durante la partida: guardar sigue siendo manual, igual que siempre.
- **Dos versiones distintas:** si una ranura cambió en dos dispositivos, el juego pregunta cuál dejar y no pisa nada solo. Podés elegir **Decidir después**.
- **Borrar:** una ranura borrada se borra en todos tus dispositivos.
- **Cerrar sesión:** las partidas quedan en ese dispositivo. En una computadora ajena, exportá lo que necesites y borrá las ranuras antes de irte.
- **Exportar e importar** siguen disponibles como respaldo.

## Límites

- Cada cuenta guarda hasta 3 ranuras, de menos de 2 MB cada una. El plan gratuito de Supabase alcanza de sobra para un grupo de amigos.
- Si un proyecto gratuito pasa una semana sin actividad, Supabase puede pausarlo. Se reactiva desde su panel; mientras tanto el juego sigue guardando en el dispositivo.
- La contraseña nunca se guarda en el juego: la maneja Supabase. El navegador conserva solo un token de sesión.
