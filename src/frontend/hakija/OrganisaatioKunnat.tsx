import React, { useContext } from 'react';
import { LanguageContext } from '../contexts';
import FormFieldContainer from '../FormFieldContainer';
import KoodiMultiSelect from '../KoodiMultiSelect';
import {Koodi, Rekisterointi, RekisterointiVirheet} from '../types';

type Props = {
    readOnly?: boolean,
    kaikkiKunnat: Koodi[],
    kunnat: string[],
    setKunnat: (kunnat: string[]) => void,
    errors: RekisterointiVirheet<Rekisterointi>,
}

export default function OrganisaatioKunnat({readOnly, kaikkiKunnat, kunnat, setKunnat, errors}: Props) {
    const { i18n } = useContext(LanguageContext);

    return (
        <>
            <FormFieldContainer readOnly={readOnly}
                                errorText={errors.kunnat as string}
                                label={i18n.translate('ORGANISAATION_KUNNAT')}>
                <KoodiMultiSelect selectable={kaikkiKunnat}
                                  selected={kunnat}
                                  disabled={readOnly}
                                  onChange={setKunnat} />
            </FormFieldContainer>
        </>
    );
}
