import React, {useContext, useEffect, useState} from 'react';
import {Organisaatio, Koodi, Rekisterointi, RekisterointiVirheet, Yhteystiedot} from '../types';
import OrganisaatioTiedot from './OrganisaatioTiedot';
import { LanguageContext } from '../contexts';
import OrganisaatioSahkopostit from './OrganisaatioSahkopostit';
import Fieldset from '../Fieldset';
import OrganisaatioKunnat from './OrganisaatioKunnat';
import YhteystiedotInput from "./YhteystiedotInput";

type Props = {
    initialOrganisaatio: Organisaatio
    organisaatio: Organisaatio
    setOrganisaatio: (organisaatio: Partial<Organisaatio>) => void
    kaikkiKunnat: Koodi[]
    kunnat: string[]
    setKunnat: (kunnat: string[]) => void
    sahkopostit: string[]
    setSahkopostit: (sahkopostit: string[]) => void
    virheetCallback: (virheet: RekisterointiVirheet<Rekisterointi>) => void
}

const tyhjatVirheet: RekisterointiVirheet<Rekisterointi> = {};

export default function RekisterointiOrganisaatio(props: Props) {
    const { i18n } = useContext(LanguageContext);
    const [ virheet, asetaVirheet ] = useState(tyhjatVirheet);

    useEffect(() => {
        console.log("props.organisaatio muuttunut!");
    }, [props.organisaatio]);

    function paivitaOrganisaatio(paivitys: Partial<Organisaatio>, virheet: Partial<RekisterointiVirheet<Organisaatio>>) {
        asetaVirheet((vanhatVirheet) => {
            const uudetVirheet = {...vanhatVirheet, ...virheet};
            props.virheetCallback(uudetVirheet);
            return uudetVirheet;
        });
        props.setOrganisaatio(paivitys);
    }

    return (
        <form>
            <Fieldset title={i18n.translate('ORGANISAATION_TIEDOT')}
                      description={i18n.translate('ORGANISAATION_TIEDOT_KUVAUS')}>
                <OrganisaatioTiedot readOnly={!!props.initialOrganisaatio.oid}
                                    kaikkiKunnat={props.kaikkiKunnat}
                                    initialOrganisaatio={props.initialOrganisaatio}
                                    organisaatio={props.organisaatio}
                                    setOrganisaatio={props.setOrganisaatio}
                                    errors={virheet.organisaatio} />
            </Fieldset>
            <Fieldset title={i18n.translate('ORGANISAATION_YHTEYSTIEDOT')}
                      description={i18n.translate('ORGANISAATION_YHTEYSTIEDOT_KUVAUS')}>
                <YhteystiedotInput vainLuku={false} //{!!props.initialOrganisaatio.oid}
                                   yhteystiedot={props.organisaatio.yhteystiedot}
                                   paivitaYhteystiedot={(yhteystiedot: Partial<Yhteystiedot>, virheet: Partial<RekisterointiVirheet<Yhteystiedot>>) => {
                                       paivitaOrganisaatio(
                                           { yhteystiedot: {...props.organisaatio.yhteystiedot, ...yhteystiedot} },
                                           { yhteystiedot: {...props.organisaatio.yhteystiedot, ...virheet } });
                                   }} />
            </Fieldset>
            <Fieldset title={i18n.translate('ORGANISAATION_KUNNAT')}
                      description={i18n.translate('ORGANISAATION_KUNNAT_OHJE')}>
                <OrganisaatioKunnat readOnly={false}
                                    kaikkiKunnat={props.kaikkiKunnat}
                                    kunnat={props.kunnat}
                                    setKunnat={props.setKunnat}
                                    errors={virheet} />
            </Fieldset>
            <Fieldset title={i18n.translate('ORGANISAATION_SAHKOPOSTIT')}
                      description={i18n.translate('ORGANISAATION_SAHKOPOSTIT_KUVAUS')}>
                <OrganisaatioSahkopostit sahkopostit={props.sahkopostit}
                                         setSahkopostit={props.setSahkopostit}
                                         errors={virheet} />
            </Fieldset>
        </form>
    );
}
