import React, {useContext, useState} from "react";
import {LanguageContext} from "../contexts";
import {ConfigurationContext} from "../contexts";
import {useDebounce} from "use-debounce";
import RekisterointiLista from "./RekisterointiLista";
import Box from "@opetushallitus/virkailija-ui-components/Box";
import createTheme from "@opetushallitus/virkailija-ui-components/createTheme";
import VirkailijaRaamit from "@opetushallitus/virkailija-ui-components/VirkailijaRaamit";
import {ThemeProvider} from "styled-components";
import {Tila} from "./rekisterointihakemus";
import Tabs from "@opetushallitus/virkailija-ui-components/Tabs";
import Tab from "@opetushallitus/virkailija-ui-components/Tab";
import Input from "@opetushallitus/virkailija-ui-components/Input";
import FilterVariantIcon from "mdi-react/FilterVariantIcon";

const theme = createTheme();

export default function Rekisteroinnit() {
    const { i18n } = useContext(LanguageContext);
    const configuration = useContext(ConfigurationContext);
    const [hakutermiInput, asetaHakutermiInput] = useState("");
    const [hakutermi] = useDebounce(hakutermiInput, 500);
    const [tila, asetaTila] = useState(Tila.KASITTELYSSA);

    function vaihdaTila(uusiTila: string) {
        asetaTila(uusiTila as Tila);
    }

    function vaihdaHakutermi(uusiHakutermi: string) {
        console.log(`Hakutermi: ${uusiHakutermi}`);
        asetaHakutermiInput(uusiHakutermi);
    }

    return (
        <ConfigurationContext.Provider value={configuration}>
            <VirkailijaRaamit scriptUrl={configuration.virkailijaRaamitUrl} />
            <ThemeProvider theme={theme}>
                <Box className="varda-rekisteroinnit">
                    <h2>{i18n.translate('REKISTEROINNIT_OTSIKKO')}</h2>
                    <p>{i18n.translate('REKISTEROINNIT_KUVAUS')}</p>
                    <Input type="text"
                           placeholder={i18n.translate('REKISTEROINNIT_SUODATA')} value={hakutermiInput}
                           prefix={<FilterVariantIcon />} onChange={e => vaihdaHakutermi(e.target.value)} />
                    <Tabs value={tila} onChange={vaihdaTila}>
                        <Tab value={Tila.KASITTELYSSA}>{ i18n.translate(`REKISTEROINNIT_TILA_KASITTELYSSA`) }</Tab>
                        <Tab value={Tila.HYVAKSYTTY}>{ i18n.translate(`REKISTEROINNIT_TILA_HYVAKSYTTY`) }</Tab>
                        <Tab value={Tila.HYLATTY}>{ i18n.translate(`REKISTEROINNIT_TILA_HYLATTY`) }</Tab>
                    </Tabs>
                    <RekisterointiLista tila={tila} hakutermi={hakutermi}/>
                </Box>
            </ThemeProvider>
        </ConfigurationContext.Provider>
    );
}
