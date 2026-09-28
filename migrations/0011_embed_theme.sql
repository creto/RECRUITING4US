-- Company colors for the embedded apply form. Missing values stay the white default.

alter table companies
  add column if not exists embed_background text not null default '#ffffff',
  add column if not exists embed_ink text not null default '#14221b',
  add column if not exists embed_accent text not null default '#036145',
  add column if not exists embed_accent_ink text not null default '#ffffff';

alter table companies drop constraint if exists companies_embed_colors_hex;
alter table companies add constraint companies_embed_colors_hex check (
  embed_background ~ '^#[0-9a-fA-F]{6}$'
  and embed_ink ~ '^#[0-9a-fA-F]{6}$'
  and embed_accent ~ '^#[0-9a-fA-F]{6}$'
  and embed_accent_ink ~ '^#[0-9a-fA-F]{6}$'
);
