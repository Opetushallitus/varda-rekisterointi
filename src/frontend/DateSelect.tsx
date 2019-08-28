import React, { useContext } from 'react';
import DatePicker from 'react-datepicker';
import { LocalDate } from './types';
import { parseISO, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { LanguageContext } from './contexts';

type Props = {
    value?: LocalDate,
    disabled?: boolean,
    onChange: (value?: LocalDate) => void,
}

const UI_FORMAT = 'dd.MM.yyyy';
const LOCAL_DATE_FORMAT = 'yyyy-MM-dd';

export default function DateSelect(props: Props) {
    const language = useContext(LanguageContext);
    const value = props.value ? parseISO(props.value) : new Date();
    return <DatePicker className="oph-input"
                       locale={language}
                       dateFormat={UI_FORMAT}
                       selected={value}
                       disabled={props.disabled}
                       onChange={date => date != null ? props.onChange(format(date, LOCAL_DATE_FORMAT)) : null} />
}