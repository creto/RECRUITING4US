-- Buttons use the light logo green. Label text on that fill stays dark so it can be read.

alter table companies alter column embed_accent set default '#cefa90';
alter table companies alter column embed_accent_ink set default '#14221b';

update companies
set embed_accent = '#cefa90',
    embed_accent_ink = '#14221b'
where lower(embed_accent) in ('#036145', '#78dd55', '#0c6e3c', '#04966a');
