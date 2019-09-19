import React, {useContext} from "react";
import {LanguageContext} from '../contexts';
import {Rekisterointihakemus} from "./rekisterointihakemus";
import {Lista} from "../Lista";

type Props = {
    rekisteroinnit: Rekisterointihakemus[];
}

export default function RekisterointiLista({ rekisteroinnit } : Props) {
    const { i18n } = useContext(LanguageContext);
    const otsikot = [
        i18n.translate("ORGANISAATION_NIMI"),
        i18n.translate("VASTUUHENKILO"),
        i18n.translate("YTUNNUS"),
        i18n.translate("SAAPUMISAIKA")
    ];
    const tunnisteGeneraattori = (rekisterointi: Rekisterointihakemus) => rekisterointi.id.toString();
    const sarakeGeneraattori = (rekisterointi: Rekisterointihakemus) => {
        return [
            { data: rekisterointi.organisaatio.nimi.fi || "" }, // TODO: lokalisaatio
            { data: `${rekisterointi.kayttaja.etunimi} ${rekisterointi.kayttaja.sukunimi}` },
            { data: rekisterointi.organisaatio.ytunnus },
            { data: rekisterointi.saapumisaika.toString() } // TODO: formatoi saapumisaika!
        ];
    };
    return (
        <div className="varda-rekisterointi-lista">
            <Lista
                otsikot={otsikot}
                rivit={rekisteroinnit}
                tunnisteGeneraattori={tunnisteGeneraattori}
                sarakeGeneraattori={sarakeGeneraattori}/>
        </div>
    )
}
