ALTER TABLE kayttaja DROP CONSTRAINT kayttaja_pkey;
ALTER TABLE kayttaja DROP COLUMN rekisterointi;
ALTER TABLE kayttaja RENAME COLUMN uusi_rekisterointi TO rekisterointi;
ALTER TABLE kayttaja ADD PRIMARY KEY (rekisterointi);

ALTER TABLE paatos DROP CONSTRAINT paatos_pkey;
ALTER TABLE paatos DROP COLUMN rekisterointi_id;
ALTER TABLE paatos RENAME COLUMN uusi_rekisterointi_id TO rekisterointi_id;
ALTER TABLE paatos ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE yhteystiedot DROP CONSTRAINT yhteystiedot_pkey;
ALTER TABLE yhteystiedot DROP COLUMN rekisterointi_id;
ALTER TABLE yhteystiedot RENAME COLUMN uusi_rekisterointi_id TO rekisterointi_id;
ALTER TABLE yhteystiedot ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE organisaatio DROP CONSTRAINT organisaatio_pkey;
ALTER TABLE organisaatio DROP COLUMN rekisterointi_id;
ALTER TABLE organisaatio RENAME COLUMN uusi_rekisterointi_id TO rekisterointi_id;
ALTER TABLE organisaatio ADD PRIMARY KEY (rekisterointi_id);

ALTER TABLE rekisterointi DROP CONSTRAINT rekisterointi_pkey;
ALTER TABLE rekisterointi DROP COLUMN id;
ALTER TABLE rekisterointi RENAME COLUMN uusi_id TO id;
ALTER TABLE rekisterointi ADD PRIMARY KEY (id);
