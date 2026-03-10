-- Generated from public/boooks/books.json
begin;

with new_authors(name) as (
  values
    ('Ruben Morgado'),
    ('Armindo António'),
    ('Vários'),
    ('Inocêncio Domingos'),
    ('Carlos Morgado'),
    ('Bruno Morgado'),
    ('Ronaldo Cagiano'),
    ('Bruno Gaudêncio'),
    ('Eduardo Quive'),
    ('Mélio Tinga'),
    ('Belisário Tinga'),
    ('Yud Mauro da Costa'),
    ('Jessica Fortes'),
    ('Jelissa Abdula'),
    ('Israel Campos'),
    ('Carmen Saranga')
)
insert into public.authors (name)
select name
from new_authors
where not exists (
  select 1 from public.authors a where a.name = new_authors.name
);

insert into public.books (title, slug, price_mzn, stock, language, is_active)
values
  ('Nas margens da lua', 'nas-margens-da-lua', 850, 0, 'pt', true),
  ('Sobreviver ao Fogo', 'sobreviver-ao-fogo', 850, 500, 'pt', true),
  ('Novas vozes novas histórias (23,24,25)', 'novas-vozes-novas-historias-23-24-25', 600, 500, 'pt', true),
  ('Memórias', 'memorias', 0, 0, 'pt', true),
  ('Poemetria', 'poemetria', 600, 0, 'pt', true),
  ('Observador de sonhos', 'observador-de-sonhos', 500, 0, 'pt', true),
  ('Dicionário de Pequenas Solidões', 'dicionario-de-pequenas-solidoes', 600, 500, 'pt', true),
  ('Cântico voraz do Precipício', 'cantico-voraz-do-precipicio', 500, 500, 'pt', true),
  ('Navegar.amor.café', 'navegar-amor-cafe', 650, 0, 'pt', true),
  ('Mutiladas (I edição)', 'mutiladas-i-edicao', 750, 0, 'pt', true),
  ('Mutiladas (II edição)', 'mutiladas-ii-edicao', 800, 500, 'pt', true),
  ('Névoa na Sala (I edição)', 'nevoa-na-sala-i-edicao', 850, 500, 'pt', true),
  ('Névoa na Sala (II edição)', 'nevoa-na-sala-ii-edicao', 900, 500, 'pt', true),
  ('Amores e outras cores', 'amores-e-outras-cores', 1000, 0, 'pt', true),
  ('Todas as coisas visíveis', 'todas-as-coisas-visiveis', 650, 0, 'pt', true),
  ('Servil', 'servil', 1500, 500, 'pt', true),
  ('Camões Revisitado e Reiventado', 'camoes-revisitado-e-reiventado', 0, 0, 'pt', true),
  ('Pensamentos da Madrugada - Conversas ao logo da estrada', 'pensamentos-da-madrugada-conversas-ao-logo-da-estrada', 1000, 500, 'pt', true),
  ('Rosita', 'rosita', 800, 500, 'pt', true),
  ('A Saga da Leoa', 'a-saga-da-leoa', 1500, 500, 'pt', true),
  ('Sobre Toda Escridão', 'sobre-toda-escridao', 700, 500, 'pt', true),
  ('Construir amanhã com barro de dentro vozes do pós-independência', 'construir-amanha-com-barro-de-dentro-vozes-do-pos-independencia', 800, 500, 'pt', true),
  ('O Medo é um GPS', 'o-medo-e-um-gps', 1500, 500, 'pt', true)
on conflict (slug) do update
set title = excluded.title,
    price_mzn = excluded.price_mzn,
    stock = excluded.stock,
    language = excluded.language,
    is_active = excluded.is_active;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'nas-margens-da-lua'
where a.name = 'Ruben Morgado'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'sobreviver-ao-fogo'
where a.name = 'Armindo António'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'novas-vozes-novas-historias-23-24-25'
where a.name = 'Vários'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'memorias'
where a.name = 'Inocêncio Domingos'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'poemetria'
where a.name = 'Carlos Morgado'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'observador-de-sonhos'
where a.name = 'Bruno Morgado'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'dicionario-de-pequenas-solidoes'
where a.name = 'Ronaldo Cagiano'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'cantico-voraz-do-precipicio'
where a.name = 'Bruno Gaudêncio'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'navegar-amor-cafe'
where a.name = 'Ruben Morgado'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'mutiladas-i-edicao'
where a.name = 'Eduardo Quive'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'mutiladas-ii-edicao'
where a.name = 'Eduardo Quive'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'nevoa-na-sala-i-edicao'
where a.name = 'Mélio Tinga'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'nevoa-na-sala-ii-edicao'
where a.name = 'Mélio Tinga'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'amores-e-outras-cores'
where a.name = 'Armindo António'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'todas-as-coisas-visiveis'
where a.name = 'Vários'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'servil'
where a.name = 'Belisário Tinga'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'camoes-revisitado-e-reiventado'
where a.name = 'Vários'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'pensamentos-da-madrugada-conversas-ao-logo-da-estrada'
where a.name = 'Yud Mauro da Costa'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'pensamentos-da-madrugada-conversas-ao-logo-da-estrada'
where a.name = 'Jessica Fortes'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'rosita'
where a.name = 'Armindo António'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'a-saga-da-leoa'
where a.name = 'Jelissa Abdula'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'sobre-toda-escridao'
where a.name = 'Mélio Tinga'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'construir-amanha-com-barro-de-dentro-vozes-do-pos-independencia'
where a.name = 'Eduardo Quive'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'construir-amanha-com-barro-de-dentro-vozes-do-pos-independencia'
where a.name = 'Israel Campos'
on conflict do nothing;

insert into public.authors_books (author_id, book_id)
select a.id, b.id
from public.authors a
join public.books b on b.slug = 'o-medo-e-um-gps'
where a.name = 'Carmen Saranga'
on conflict do nothing;

commit;
