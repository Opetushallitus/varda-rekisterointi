import {Kayttaja, Organisaatio, tyhjatYhteystiedot} from "./types";
import {Rekisterointihakemus, Tila} from "./virkailija/rekisterointihakemus";

export const dummyOrganisaatio: Organisaatio = {
    ytjNimi: {
        alkuPvm: null,
        kieli: 'fi',
        nimi: 'Testi'
    },
    kieletUris: [],
    maaUri: '',
    kotipaikkaUri: '',
    yhteystiedot: tyhjatYhteystiedot,
    ytunnus: '',
    alkuPvm: null,
    tyypit: [],
    yritysmuoto: ''
};

export const dummyKayttaja: Kayttaja = {
    asiointikieli: 'fi',
    sahkoposti: '',
    saateteksti: '',
    etunimi: 'Testi',
    sukunimi: 'Henkilö'
};

export const dummyHakemus: Rekisterointihakemus = {
    kunnat: [],
    sahkopostit: [],
    kayttaja: dummyKayttaja,
    organisaatio: dummyOrganisaatio,
    id: 0,
    vastaanotettu: '14.11.2019 10:44',
    tila: Tila.KASITTELYSSA
};
