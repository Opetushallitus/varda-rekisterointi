CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER TABLE rekisterointi ADD COLUMN uusi_id uuid UNIQUE NOT NULL DEFAULT uuid_generate_v4();

ALTER TABLE kayttaja ADD COLUMN uusi_rekisterointi uuid UNIQUE;
UPDATE kayttaja AS k SET uusi_rekisterointi = (SELECT r.uusi_id FROM rekisterointi AS r WHERE r.id = k.rekisterointi);
ALTER TABLE kayttaja ALTER COLUMN uusi_rekisterointi SET NOT NULL;
ALTER TABLE kayttaja ADD CONSTRAINT kayttaja_rekisterointi_uuid_fk FOREIGN KEY (uusi_rekisterointi) REFERENCES rekisterointi (uusi_id);
ALTER TABLE kayttaja DROP CONSTRAINT kayttaja_pkey;
ALTER TABLE kayttaja DROP COLUMN rekisterointi;
ALTER TABLE kayttaja RENAME COLUMN uusi_rekisterointi TO rekisterointi;
ALTER TABLE kayttaja ADD PRIMARY KEY (rekisterointi);

ALTER TABLE paatos ADD COLUMN uusi_rekisterointi_id uuid UNIQUE;
UPDATE paatos AS p SET uusi_rekisterointi_id = (SELECT r.uusi_id FROM rekisterointi AS r WHERE r.id = p.rekisterointi_id);
ALTER TABLE paatos ALTER COLUMN uusi_rekisterointi_id SET NOT NULL;
ALTER TABLE paatos ADD CONSTRAINT paatos_rekisterointi_uuid_fk FOREIGN KEY (uusi_rekisterointi_id) REFERENCES rekisterointi (uusi_id);
ALTER TABLE paatos DROP CONSTRAINT paatos_pkey;
ALTER TABLE paatos DROP COLUMN rekisterointi_id;
ALTER TABLE paatos RENAME COLUMN uusi_rekisterointi_id TO rekisterointi_id;
ALTER TABLE paatos ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE yhteystiedot ADD COLUMN uusi_rekisterointi_id uuid UNIQUE;
UPDATE yhteystiedot AS y SET uusi_rekisterointi_id = (SELECT r.uusi_id FROM rekisterointi AS r WHERE r.id = y.rekisterointi_id);
ALTER TABLE yhteystiedot ALTER COLUMN uusi_rekisterointi_id SET NOT NULL;
ALTER TABLE yhteystiedot ADD CONSTRAINT yhteystiedot_rekisterointi_uuid_fk FOREIGN KEY (uusi_rekisterointi_id) REFERENCES rekisterointi (uusi_id);
ALTER TABLE yhteystiedot DROP CONSTRAINT yhteystiedot_pkey;
ALTER TABLE yhteystiedot DROP COLUMN rekisterointi_id;
ALTER TABLE yhteystiedot RENAME COLUMN uusi_rekisterointi_id TO rekisterointi_id;
ALTER TABLE yhteystiedot ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE organisaatio ADD COLUMN uusi_rekisterointi_id uuid UNIQUE;
UPDATE organisaatio AS o SET uusi_rekisterointi_id = (SELECT r.uusi_id FROM rekisterointi AS r WHERE r.id = o.rekisterointi_id);
ALTER TABLE organisaatio ALTER COLUMN uusi_rekisterointi_id SET NOT NULL;
ALTER TABLE organisaatio ADD CONSTRAINT organisaatio_rekisterointi_uuid_fk FOREIGN KEY (uusi_rekisterointi_id) REFERENCES rekisterointi (uusi_id);
ALTER TABLE organisaatio DROP CONSTRAINT organisaatio_pkey;
ALTER TABLE organisaatio DROP COLUMN rekisterointi_id;
ALTER TABLE organisaatio RENAME COLUMN uusi_rekisterointi_id TO rekisterointi_id;
ALTER TABLE organisaatio ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE rekisterointi DROP CONSTRAINT rekisterointi_pkey;
ALTER TABLE rekisterointi DROP COLUMN id;
ALTER TABLE rekisterointi RENAME COLUMN uusi_id TO id;
ALTER TABLE rekisterointi ADD PRIMARY KEY (id);

