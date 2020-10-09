import React, { useState, useReducer, useEffect, useContext } from 'react';
import { cloneDeep } from 'lodash';
import Rekisterointi from '../hakija/Rekisterointi';
import { KoodiUri, Organisaatio, tyhjaOrganisaatio } from '../types';
import { useParams } from 'react-router';
import Axios from 'axios';
import Spinner from '../Spinner';
import ErrorPage from '../virhe/VirheSivu';
import { LanguageContext } from '../contexts';

const rekisteroinnitUrl = "/varda-rekisterointi/virkailija/api/rekisteroinnit";
const organisaatiotUrl = (ytunnus: string | undefined): string => `/varda-rekisterointi/virkailija/api/organisaatiot/ytunnus=${ytunnus}`;

function reducer<T>(state: T, data: Partial<T>): T {
    return { ...state, ...data };
}

export default function RekisterointiVirkailija() {
    const { i18n } = useContext(LanguageContext);
    const [initialOrganisaatio, setInitialOrganisaatio] = useState(tyhjaOrganisaatio());
    const [organisaatio, setOrganisaatio] = useReducer(reducer, tyhjaOrganisaatio());
    const [fetchLoading, setFetchLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const { ytunnus } = useParams();
    useEffect(() => {
        async function fetch() {
            try {
                setFetchLoading(true);
                setFetchError(null);
                const response = await Axios.get(organisaatiotUrl(ytunnus));
                const data = response.data;
                const tyypit: KoodiUri[] = data.tyypit ? data.tyypit : [];
                if (tyypit.indexOf('organisaatiotyyppi_07') === -1) {
                    tyypit.push('organisaatiotyyppi_07');
                }
                setInitialOrganisaatio({ ...tyhjaOrganisaatio(), ...cloneDeep(data), tyypit: tyypit });
                setOrganisaatio({ ...tyhjaOrganisaatio(), ...cloneDeep(data), tyypit: tyypit });
            } catch (error) {
                setFetchError(error);
            } finally {
                setFetchLoading(false);
            }
        }
        fetch();
    }, [ytunnus]);

    if (fetchLoading) {
        return <Spinner />;
    }
    if (fetchError) {
        return <ErrorPage>{i18n.translate('ERROR_FETCH')}</ErrorPage>;
    }

    return <Rekisterointi
                          isVirkailija
                          initialOrganisaatio={initialOrganisaatio}
                          organisaatio={organisaatio as Organisaatio}
                          setOrganisaatio={setOrganisaatio}
                          rekisteroinnitUrl={rekisteroinnitUrl} />
}
