import React, { useContext } from 'react';
import { LanguageContext } from '../contexts';
import FormFieldContainer from '../FormFieldContainer';
import InputMultiple from '../InputMultiple';
import {Rekisterointi, RekisterointiVirheet} from "../types";

type Props = {
    readOnly?: boolean,
    sahkopostit: string[],
    setSahkopostit: (sahkopostit: string[]) => void,
    errors: RekisterointiVirheet<Rekisterointi>,
}

export default function OrganisaatioSahkopostit({readOnly, sahkopostit, setSahkopostit, errors}: Props) {
    const { i18n } = useContext(LanguageContext);

    return (
        <>
            <FormFieldContainer readOnly={readOnly}
                                errorText={errors.sahkopostit as string}
                                label={i18n.translate('ORGANISAATION_SAHKOPOSTIT')}
                                helpText={i18n.translate('ORGANISAATION_SAHKOPOSTIT_OHJE')}>
                <InputMultiple values={sahkopostit}
                               disabled={readOnly}
                               hasError={!!errors.sahkopostit}
                               onChange={sahkopostit => setSahkopostit(sahkopostit)} />
            </FormFieldContainer>
        </>
    );
}
