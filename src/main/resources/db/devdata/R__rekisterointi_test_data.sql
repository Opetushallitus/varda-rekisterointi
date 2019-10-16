DELETE FROM kayttaja;
DELETE FROM rekisterointi;

INSERT INTO rekisterointi (id, kunnat, sahkopostit)
 VALUES (
     0,
     '{"Helsinki"}',
     '{"testi.yritys@testiyrit.ys"}'
 );

INSERT INTO organisaatio (rekisterointi_id, ytunnus, alkupvm, yritysmuoto, tyypit, kotipaikka, maa, nimi, nimi_alkupvm)
 VALUES (
     0,
     '0000000-0',
     CURRENT_DATE,
     'toiminimi',
     '{"vardatoimintamuoto_tm01"}',
     'Helsinki',
     'Suomi',
     'Testiyritys',
     CURRENT_DATE
 );

INSERT INTO kayttaja (id, etunimi, sukunimi, sahkoposti, asiointikieli, saateteksti, rekisterointi)
 VALUES (
     0,
     'Testi',
     'Käyttäjä',
     'testi.kayttaja@testiyrit.ys',
     'fi',
     null,
     0
 );
