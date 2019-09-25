import React, { useContext } from 'react';
import DatePicker from 'react-datepicker';
import { LocalDate } from './types';
import { parseISO, format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { LanguageContext } from './contexts';
import classNames from 'classnames/bind';

type Props = {
    value: LocalDate | null,
    disabled?: boolean,
    hasError?: boolean,
    onChange: (value: LocalDate | null) => void,
}

const UI_FORMAT = 'dd.MM.yyyy';
const LOCAL_DATE_FORMAT = 'yyyy-MM-dd';

export default function DateSelect(props: Props) {
    const { language } = useContext(LanguageContext);
    const value = props.value ? parseISO(props.value) : null;
    const classes = classNames({
        'oph-input': true,
        'oph-input-has-error': props.hasError,
    })
    return <DatePicker className={classes}
                       locale={language}
                       dateFormat={UI_FORMAT}
                       selected={value}
                       disabled={props.disabled}
                       onChange={date => props.onChange(date != null ? format(date, LOCAL_DATE_FORMAT) : null)} />
}
