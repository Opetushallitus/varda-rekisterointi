import React, { useContext, useState } from 'react';
import useAxios from 'axios-hooks';
import FormFieldContainer from '../FormFieldContainer';
import { Organisaatio, Koodi, Language, Yhteystieto } from '../types';
import { getYhteystietoArvo, isPuhelinnumero, isSahkoposti, isKayntiosoite, isPostiosoite, updateYhteystiedot, toPuhelinnumero, toSahkoposti, toOsoite, toPostinumeroUri, toPostitoimipaikka } from '../OrganisaatioYhteystietoUtils';
import { toLocalizedText } from '../LocalizableTextUtils';
import { hasLength } from '../StringUtils';
import Spinner from '../Spinner';
import { LanguageContext } from '../contexts';
import classNames from 'classnames/bind';
import { and } from '../PredicateUtils';
import ErrorPage from '../ErrorPage';

type Props = {
    readOnly?: boolean,
    initialOrganisaatio: Organisaatio,
    organisaatio: Organisaatio,
    setOrganisaatio: (organisaatio: Partial<Organisaatio>) => void,
    errors: Record<string, string>,
}

function koodiByArvoToLocalizedText(koodit: Koodi[], language: Language, arvo?: string) {
    const koodi = koodit.find(koodi => koodi.arvo === arvo);
    return koodi ? toLocalizedText(koodi.nimi, language) : '';
}

export default function OrganisaatioYhteystiedot({readOnly, initialOrganisaatio, organisaatio, setOrganisaatio, errors}: Props) {
    const { language, i18n } = useContext(LanguageContext);
    const [{data: postinumerot, loading: postinumerotLoading, error: postinumerotError}]
        = useAxios<Koodi[]>('/varda-rekisterointi/api/koodisto/POSTI/koodi?onlyValid=true');
    const [ kayntiosoiteSamaKuinPostiosoite, setKayntiosoiteSamaKuinPostiosoite ] = useState(false);

    if (postinumerotLoading) {
        return <Spinner />;
    }
    if (postinumerotError) {
        return <ErrorPage>{i18n.translate('ERROR_FETCH')}</ErrorPage>;
    }

    const kieliUri = organisaatio.ytjNimi.kieli;
    const isKieli = (yhteystieto: Yhteystieto) => yhteystieto.kieli === kieliUri;

    const initialPuhelinnumero = getYhteystietoArvo(initialOrganisaatio.yhteystiedot,
        and(isPuhelinnumero, isKieli), toPuhelinnumero);
    const puhelinnumero = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isPuhelinnumero, isKieli), toPuhelinnumero);
    const initialSahkoposti = getYhteystietoArvo(initialOrganisaatio.yhteystiedot,
        and(isSahkoposti, isKieli), toSahkoposti);
    const sahkoposti = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isSahkoposti, isKieli), toSahkoposti);

    const initialKayntiosoite = getYhteystietoArvo(initialOrganisaatio.yhteystiedot,
        and(isKayntiosoite, isKieli), toOsoite);
    const kayntiosoite = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isKayntiosoite, isKieli), toOsoite);
    const initialKayntiosoitteenPostinumeroUri = getYhteystietoArvo(initialOrganisaatio.yhteystiedot,
        and(isKayntiosoite, isKieli), toPostinumeroUri);
    const kayntiosoitteenPostinumeroUri = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isKayntiosoite, isKieli), toPostinumeroUri);
    const kayntiosoitteenPostinumero = kayntiosoitteenPostinumeroUri.replace('posti_', '');
    const kayntiosoitteenPostitoimipaikka = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isKayntiosoite, isKieli), toPostitoimipaikka);

    const initialPostiosoite = getYhteystietoArvo(initialOrganisaatio.yhteystiedot,
        and(isPostiosoite, isKieli), toOsoite);
    const postiosoite = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isPostiosoite, isKieli), toOsoite);
    const initialPostinumeroUri = getYhteystietoArvo(initialOrganisaatio.yhteystiedot,
        and(isPostiosoite, isKieli), toPostinumeroUri);
    const postinumeroUri = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isPostiosoite, isKieli), toPostinumeroUri);
    const postinumero = postinumeroUri.replace('posti_', '');
    const postitoimipaikka = getYhteystietoArvo(organisaatio.yhteystiedot,
        and(isPostiosoite, isKieli), toPostitoimipaikka);

    const puhelinnumeroDisabled = readOnly || hasLength(initialPuhelinnumero);
    const sahkopostiDisabled = readOnly || hasLength(initialSahkoposti);
    const kayntiosoiteDisabled = readOnly || hasLength(initialKayntiosoite) || kayntiosoiteSamaKuinPostiosoite;
    const kayntiosoitteenPostinumeroDisabled = readOnly || hasLength(initialKayntiosoitteenPostinumeroUri) || kayntiosoiteSamaKuinPostiosoite;
    const samaKuinPostiosoiteDisabled = readOnly || hasLength(initialKayntiosoite);
    const postiosoiteDisabled = readOnly || hasLength(initialPostiosoite);
    const postinumeroDisabled = readOnly || hasLength(initialPostinumeroUri);

    const handlePostiosoite = (values: Record<string, string>): void => {
        let yhteystiedot = organisaatio.yhteystiedot;
        yhteystiedot = updateYhteystiedot(yhteystiedot, and(isPostiosoite, isKieli), {
            kieli: kieliUri,
            osoiteTyyppi: 'posti',
            ...values
        });
        if (kayntiosoiteSamaKuinPostiosoite) {
            yhteystiedot = updateYhteystiedot(yhteystiedot, and(isKayntiosoite, isKieli), {
                kieli: kieliUri,
                osoiteTyyppi: 'kaynti',
                ...values
            });
        }
        setOrganisaatio({ yhteystiedot: yhteystiedot });
    }

    const handleKayntiosoiteSamaKuinPostiosoite = (value: boolean): void => {
        setKayntiosoiteSamaKuinPostiosoite(value);
        if (value) {
            setOrganisaatio({ yhteystiedot: updateYhteystiedot(organisaatio.yhteystiedot, and(isKayntiosoite, isKieli), {
                kieli: kieliUri,
                osoiteTyyppi: 'kaynti',
                osoite: postiosoite,
                postinumeroUri: postinumeroUri,
                postitoimipaikka: postitoimipaikka,
            })});
        }
    }

    const baseClasses = { 'oph-input': true };

    return (
        <>
            <FormFieldContainer label={i18n.translate('PUHELINNUMERO')} labelFor="puhelinnumero" errorText={errors.puhelinnumero}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!errors.puhelinnumero })}
                       type="text"
                       id="puhelinnumero"
                       value={puhelinnumero}
                       disabled={puhelinnumeroDisabled}
                       onChange={event => setOrganisaatio({ yhteystiedot: updateYhteystiedot(organisaatio.yhteystiedot, and(isPuhelinnumero, isKieli), {
                           kieli: kieliUri,
                           numero: event.currentTarget.value,
                        })})} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('ORGANISAATION_SAHKOPOSTI')} labelFor="organisaation-sahkoposti" errorText={errors.sahkoposti}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!errors.sahkoposti })}
                       type="text"
                       id="organisaation-sahkoposti"
                       value={sahkoposti}
                       disabled={sahkopostiDisabled}
                       onChange={event => setOrganisaatio({ yhteystiedot: updateYhteystiedot(organisaatio.yhteystiedot, and(isSahkoposti, isKieli), {
                           kieli: kieliUri,
                           email: event.currentTarget.value,
                        })})} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('POSTIOSOITE')} labelFor="postiosoite" errorText={errors.postiosoite}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!errors.postiosoite })}
                       type="text"
                       id="postiosoite"
                       value={postiosoite}
                       disabled={postiosoiteDisabled}
                       onChange={event => handlePostiosoite({ osoite: event.currentTarget.value })} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('POSTINUMERO')} labelFor="postinumero" errorText={errors.postinumero}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!errors.postinumero })}
                       type="text"
                       id="postinumero"
                       value={postinumero}
                       disabled={postinumeroDisabled}
                       onChange={event => handlePostiosoite({
                           postinumeroUri: `posti_${event.currentTarget.value}`,
                           postitoimipaikka: event.currentTarget.value.length === 5 ? koodiByArvoToLocalizedText(postinumerot, language, event.currentTarget.value) : '',
                       })} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('POSTITOIMIPAIKKA')}>
                <div className="oph-input-container">
                    {postitoimipaikka}
                </div>
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('KAYNTIOSOITE')} labelFor="kayntiosoite" errorText={errors.kayntiosoite}>
                <div className="oph-input-container">
                    <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!errors.kayntiosoite })}
                           type="text"
                           id="kayntiosoite"
                           value={kayntiosoite}
                           disabled={kayntiosoiteDisabled}
                           onChange={event => setOrganisaatio({ yhteystiedot: updateYhteystiedot(organisaatio.yhteystiedot, and(isKayntiosoite, isKieli), {
                               kieli: kieliUri,
                               osoiteTyyppi: 'kaynti',
                               osoite: event.currentTarget.value
                           })})} />
                    {samaKuinPostiosoiteDisabled ? null :
                    <label>
                        <input type="checkbox"
                               className="oph-checkable-input"
                               checked={kayntiosoiteSamaKuinPostiosoite}
                               onChange={event => handleKayntiosoiteSamaKuinPostiosoite(event.currentTarget.checked)} />
                        <span className="oph-checkable-text">{i18n.translate('SAMA_KUIN_POSTIOSOITE')}</span>
                    </label>
                    }
                </div>
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('KAYNTIOSOITTEEN_POSTINUMERO')} labelFor="kayntiosoitteen-postinumero" errorText={errors.kayntiosoitteenPostinumero}>
                <input className={classNames({ ...baseClasses, 'oph-input-has-error': !!errors.kayntiosoitteenPostinumero })}
                       type="text"
                       id="kayntiosoitteen-postinumero"
                       value={kayntiosoitteenPostinumero}
                       disabled={kayntiosoitteenPostinumeroDisabled}
                       onChange={event => setOrganisaatio({ yhteystiedot: updateYhteystiedot(organisaatio.yhteystiedot, and(isKayntiosoite, isKieli), {
                           kieli: kieliUri,
                           osoiteTyyppi: 'kaynti',
                           postinumeroUri: `posti_${event.currentTarget.value}`,
                           postitoimipaikka: event.currentTarget.value.length === 5 ? koodiByArvoToLocalizedText(postinumerot, language, event.currentTarget.value) : '',
                       })})} />
            </FormFieldContainer>
            <FormFieldContainer label={i18n.translate('KAYNTIOSOITTEEN_POSTITOIMIPAIKKA')}>
                <div className="oph-input-container">
                    {kayntiosoitteenPostitoimipaikka}
                </div>
            </FormFieldContainer>
        </>
    );
}
