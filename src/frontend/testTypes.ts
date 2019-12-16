import {Kayttaja, Organisaatio, Osoite} from "./types";
import {Rekisterointihakemus, Tila} from "./virkailija/rekisterointihakemus";
import {v4 as uuid} from 'uuid';

export const tyhjaOsoite: Osoite = {
    katuosoite: '',
    postinumeroUri: '',
    postitoimipaikka: ''
};

export const dummyOrganisaatio: Organisaatio = {
    ytjNimi: {
        alkuPvm: null,
        kieli: 'fi',
        nimi: 'Testi'
    },
    kieletUris: [],
    maaUri: '',
    kotipaikkaUri: '',
    yhteystiedot: {
        kayntiosoite: tyhjaOsoite,
        postiosoite: tyhjaOsoite,
        sahkoposti: '',
        puhelinnumero: ''
    },
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
    toimintamuoto: 'päiväkoti',
    id: uuid(),
    vastaanotettu: '14.11.2019 10:44',
    tila: Tila.KASITTELYSSA
};
