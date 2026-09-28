-- Product accent is a lighter, more vivid reading of the leftmost logo chevron (#036145), not the neon spring green.

alter table companies alter column embed_accent set default '#04966a';
alter table companies alter column embed_background set default '#f4f7f5';

update companies
set embed_accent = '#04966a',
    embed_accent_ink = '#ffffff'
where lower(embed_accent) in ('#036145', '#78dd55', '#0c6e3c');

update companies
set embed_background = '#f4f7f5',
    embed_ink = '#14221b'
where lower(embed_background) in ('#000000', '#07110c');
