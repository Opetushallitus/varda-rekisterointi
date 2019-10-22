import React, {useContext, useEffect, useState} from "react";
import {format, parseISO} from 'date-fns';
import Axios from "axios";
import {LanguageContext} from '../contexts';
import {Rekisterointihakemus, Tila} from "./rekisterointihakemus";
import {Lista} from "../Lista";

import Box from "@opetushallitus/virkailija-ui-components/Box";
import Spin from "@opetushallitus/virkailija-ui-components/Spin";

import styles from "./RekisterointiLista.module.css";

const rekisteroinnitUrl = "/varda-rekisterointi/virkailija/api/rekisteroinnit";
const tyhjaLista: Rekisterointihakemus[] = [];

type Props = {
    tila?: Tila,
    hakutermi?: string
}

export default function RekisterointiLista({ tila = Tila.KASITTELYSSA, hakutermi } : Props) {
    const { i18n } = useContext(LanguageContext);
    const [rekisteroinnit, asetaRekisteroinnit] = useState(tyhjaLista);
    const [latausKesken, asetaLatausKesken] = useState(true);
    const [latausVirhe, asetaLatausVirhe] = useState(false);
    const saapumisAikaFormat = 'd.M.y HH:mm';
    const otsikot = [
        i18n.translate("ORGANISAATION_NIMI"),
        i18n.translate("VASTUUHENKILO"),
        i18n.translate("YTUNNUS"),
        i18n.translate("SAAPUMISAIKA")
    ];
    const tunnisteGeneraattori = (rekisterointi: Rekisterointihakemus) => rekisterointi.id.toString();
    const sarakeGeneraattori = (rekisterointi: Rekisterointihakemus) => {
        return [
            { data: rekisterointi.organisaatio.ytjNimi.nimi },
            { data: `${rekisterointi.kayttaja.etunimi} ${rekisterointi.kayttaja.sukunimi}` },
            { data: rekisterointi.organisaatio.ytunnus },
            { data: format(parseISO(rekisterointi.vastaanotettu), saapumisAikaFormat) }
        ];
    };

    useEffect(() => {
        async function lataa() {
            try {
                asetaLatausKesken(true);
                asetaLatausVirhe(false);
                const params = { tila, hakutermi};
                const response = await Axios.get(rekisteroinnitUrl, { params });
                asetaRekisteroinnit(response.data);
            } catch (e) {
                asetaLatausVirhe(true);
                console.error(e);
            } finally {
                asetaLatausKesken(false);
            }
        }
        lataa();
    }, [tila, hakutermi]);

    if (latausKesken) {
        return <Spin />;
    }

    if (latausVirhe) {
        return <div className="virhe">{i18n.translate('REKISTEROINNIT_LATAUSVIRHE')}</div>
    }

    return (
        <Box className={styles.vardaRekisterointiLista}>
            <Lista
                otsikot={otsikot}
                rivit={rekisteroinnit}
                tunnisteGeneraattori={tunnisteGeneraattori}
                sarakeGeneraattori={sarakeGeneraattori}/>
        </Box>
    )
}
