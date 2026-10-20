-- Données de démo : les 11 projets d'origine de Sophie Bluel.
-- Remet la table "works" à zéro puis la remplit.
-- Utilisation (depuis la racine du projet) :  sqlite3 database.sqlite < donnees-demo.sql
-- (les images correspondantes doivent être dans images/)
-- En production, les URL sont adaptées avec sed → donnees-demo-prod.sql (voir README)

-- BEGIN / COMMIT : tout est appliqué d'un coup, ou rien en cas d'erreur
BEGIN;

-- Vide la table des projets
DELETE FROM works;

-- Remet le compteur d'id à zéro : les projets auront les id 1 à 11
UPDATE sqlite_sequence SET seq = 0 WHERE name = 'works';

-- Catégories : 1 = Objets, 2 = Appartements, 3 = Hotels & restaurants
-- userId 1 = Sophie Bluel
INSERT INTO works (title, imageUrl, categoryId, userId) VALUES
  ('Abajour Tahina',                'http://localhost:5678/images/abajour-tahina.webp',              1, 1),
  ('Appartement Paris V',           'http://localhost:5678/images/appartement-paris-v.webp',         2, 1),
  ('Restaurant Sushisen - Londres', 'http://localhost:5678/images/restaurant-sushisen-londres.webp', 3, 1),
  ('Villa "La Balisiere" - Port Louis', 'http://localhost:5678/images/la-balisiere.webp',            2, 1),
  ('Structures Thermopolis',        'http://localhost:5678/images/structures-thermopolis.webp',      1, 1),
  ('Appartement Paris X',           'http://localhost:5678/images/appartement-paris-x.webp',         2, 1),
  ('Pavillon "Le coteau" - Cassis', 'http://localhost:5678/images/le-coteau-cassis.webp',            2, 1),
  ('Villa Ferneze - Isola d''Asti', 'http://localhost:5678/images/villa-ferneze.webp',               2, 1),
  ('Appartement Paris XVIII',       'http://localhost:5678/images/appartement-paris-xviii.webp',     2, 1),
  ('Bar "Lullaby" - Paris',         'http://localhost:5678/images/bar-lullaby-paris.webp',           3, 1),
  ('Hotel First Arte - New Delhi',  'http://localhost:5678/images/hotel-first-arte-new-delhi.webp',  3, 1);

COMMIT;
