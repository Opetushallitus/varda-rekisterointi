-- lisätään sarake vanhanmalliselle id:ille
ALTER TABLE rekisterointi ADD COLUMN vanha_id BIGSERIAL UNIQUE;
-- varmistetaan, ettei tulee id-konflikteja
SELECT setval('rekisterointi_vanha_id_seq', (SELECT max(vanha_id) FROM rekisterointi_id_historia));
-- lisätään vanhanmalliset id:t uusille riveille
WITH uudet_rivit AS (
    SELECT nextval('rekisterointi_vanha_id_seq') AS vanha_id, id AS uusi_id
    FROM rekisterointi
    WHERE id NOT IN (SELECT uusi_id FROM rekisterointi_id_historia)
) INSERT INTO rekisterointi_id_historia SELECT * FROM uudet_rivit;
-- populoidaan vanha_id historiataulun pohjalta
UPDATE rekisterointi AS r SET vanha_id = (SELECT h.vanha_id FROM rekisterointi_id_historia h WHERE h.uusi_id = r.id);

ALTER TABLE kayttaja ADD COLUMN vanha_rekisterointi BIGINT UNIQUE;
UPDATE kayttaja AS k SET vanha_rekisterointi = (SELECT r.vanha_id FROM rekisterointi AS r WHERE r.id = k.rekisterointi);

ALTER TABLE paatos ADD COLUMN vanha_rekisterointi_id BIGINT UNIQUE;
UPDATE paatos AS p SET vanha_rekisterointi_id = (SELECT r.vanha_id FROM rekisterointi AS r WHERE r.id = p.rekisterointi_id);

ALTER TABLE yhteystiedot ADD COLUMN vanha_rekisterointi_id BIGINT UNIQUE;
UPDATE yhteystiedot AS y SET vanha_rekisterointi_id = (SELECT r.vanha_id FROM rekisterointi AS r WHERE r.id = y.rekisterointi_id);

ALTER TABLE organisaatio ADD COLUMN vanha_rekisterointi_id BIGINT UNIQUE;
UPDATE organisaatio AS o SET vanha_rekisterointi_id = (SELECT r.vanha_id FROM rekisterointi AS r WHERE r.id = o.rekisterointi_id);

-- lisätään foreign key constraintit id-sarakkeille

ALTER TABLE kayttaja ALTER COLUMN vanha_rekisterointi SET NOT NULL;
ALTER TABLE kayttaja ADD CONSTRAINT kayttaja_rekisterointi_id_fk FOREIGN KEY (vanha_rekisterointi) REFERENCES rekisterointi (vanha_id);

ALTER TABLE paatos ALTER COLUMN vanha_rekisterointi_id SET NOT NULL;
ALTER TABLE paatos ADD CONSTRAINT paatos_rekisterointi_id_fk FOREIGN KEY (vanha_rekisterointi_id) REFERENCES rekisterointi (vanha_id);

ALTER TABLE yhteystiedot ALTER COLUMN vanha_rekisterointi_id SET NOT NULL;
ALTER TABLE yhteystiedot ADD CONSTRAINT yhteystiedot_rekisterointi_id_fk FOREIGN KEY (vanha_rekisterointi_id) REFERENCES rekisterointi (vanha_id);

ALTER TABLE organisaatio ALTER COLUMN vanha_rekisterointi_id SET NOT NULL;
ALTER TABLE organisaatio ADD CONSTRAINT organisaatio_rekisterointi_id_fk FOREIGN KEY (vanha_rekisterointi_id) REFERENCES rekisterointi (vanha_id);

-- poistetaan primary key constraintit ja uuid--sarakkeet
-- uudelleennimetään lisätyt id-sarakkeet ja lisätään primary key constraintit

ALTER TABLE kayttaja DROP CONSTRAINT kayttaja_pkey;
ALTER TABLE kayttaja DROP COLUMN rekisterointi;
ALTER TABLE kayttaja RENAME COLUMN vanha_rekisterointi TO rekisterointi;
ALTER TABLE kayttaja ADD PRIMARY KEY (rekisterointi);

ALTER TABLE paatos DROP CONSTRAINT paatos_pkey;
ALTER TABLE paatos DROP COLUMN rekisterointi_id;
ALTER TABLE paatos RENAME COLUMN vanha_rekisterointi_id TO rekisterointi_id;
ALTER TABLE paatos ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE yhteystiedot DROP CONSTRAINT yhteystiedot_pkey;
ALTER TABLE yhteystiedot DROP COLUMN rekisterointi_id;
ALTER TABLE yhteystiedot RENAME COLUMN vanha_rekisterointi_id TO rekisterointi_id;
ALTER TABLE yhteystiedot ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE organisaatio DROP CONSTRAINT organisaatio_pkey;
ALTER TABLE organisaatio DROP COLUMN rekisterointi_id;
ALTER TABLE organisaatio RENAME COLUMN vanha_rekisterointi_id TO rekisterointi_id;
ALTER TABLE organisaatio ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE rekisterointi_id_historia DROP CONSTRAINT rekisterointi_id_historia_rekisterointi_fk;
ALTER TABLE rekisterointi_id_historia ADD CONSTRAINT rekisterointi_id_historia_rekisterointi_fk FOREIGN KEY (vanha_id) REFERENCES rekisterointi (vanha_id);

ALTER TABLE rekisterointi DROP CONSTRAINT rekisterointi_pkey;
ALTER TABLE rekisterointi DROP COLUMN id;
ALTER TABLE rekisterointi RENAME COLUMN vanha_id TO id;
ALTER TABLE rekisterointi ADD PRIMARY KEY (id);
