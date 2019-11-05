import React from "react";
import {render, unmountComponentAtNode} from "react-dom";
import {act, Simulate} from "react-dom/test-utils";
import YhteystiedotInput from "./YhteystiedotInput";
import {Koodi, Virheet, Yhteystiedot} from "../types";
import {AxiosPromise, AxiosResponse} from "axios";

let container: Element;
const noOpPaivita = (_yhteystiedot: Partial<Yhteystiedot>, _virheet: Virheet<Yhteystiedot>) => { /* no op */ };
async function renderInput(yhteystiedot: Yhteystiedot, callback = noOpPaivita) {
    await act(async() => {
        render(
            <YhteystiedotInput
                alkuperaisetYhteystiedot={yhteystiedot}
                yhteystiedot={{...yhteystiedot}}
                paivitaYhteystiedot={callback}
            />,
            container
        );
    });
}

type UseAxiosFunction<T> = (config: string) => [{ data: T, loading: boolean}, (() => AxiosPromise)?]

jest.mock('axios-hooks', () => {
    const postinumerot: Koodi[] = [
        {
            arvo: '00950', // iistimpää => siistimpää
            nimi: {
                'fi': 'Helsinki',
                'sv': 'Helsingfors',
                'en': 'Helsinki'
            },
            uri: 'posti_00950'
        }
    ];
    const useAxios: UseAxiosFunction<Koodi[]> = (config: string) => {
        const response = {data: postinumerot, loading: false};
        return [response];
    };
    return {
        __esModule: true,
        useAxios,
        default: useAxios
    }
});
describe('YhteystiedotInput', () => {
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });
    afterEach(() => {
        unmountComponentAtNode(container);
        container.remove();
    });
    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('näyttää annetut alkuperäiset tiedot lukutilassa', async () => {
        const alkuperaiset: Yhteystiedot = {
            puhelinnumero: "5551234567",
            sahkoposti: "lots@of.spam"
        };
        await renderInput(alkuperaiset);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        const sahkopostiInput = container.querySelector("#yhteystiedot-sahkoposti") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        expect(sahkopostiInput).not.toBeNull();
        expect(puhelinnumeroInput.value).toEqual(alkuperaiset.puhelinnumero);
        expect(sahkopostiInput.value).toEqual(alkuperaiset.sahkoposti);
        expect(puhelinnumeroInput.disabled).toBeTruthy();
        expect(sahkopostiInput.disabled).toBeTruthy();
    });

    it('sallii muokata, kun alkuperäinen on tyhjä', async () => {
        const alkuperaiset: Yhteystiedot = {};
        await renderInput(alkuperaiset);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        const sahkopostiInput = container.querySelector("#yhteystiedot-sahkoposti") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        expect(sahkopostiInput).not.toBeNull();
        expect(puhelinnumeroInput.disabled).toBeFalsy();
        expect(sahkopostiInput.disabled).toBeFalsy();
    });

    it('kutsuu päivitys-callbackia ja validoi', async () => {
        const alkuperaiset: Yhteystiedot = {};
        let muutos: Partial<Yhteystiedot> = {};
        let validointiVirheet: Virheet<Yhteystiedot> = {};
        const callback = (yhteystiedot: Partial<Yhteystiedot>, virheet: Virheet<Yhteystiedot>) => {
            muutos = yhteystiedot;
            validointiVirheet = virheet;
        };
        await renderInput(alkuperaiset, callback);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        const puhelinnumero = "010234567";
        puhelinnumeroInput.value = puhelinnumero;
        Simulate.change(puhelinnumeroInput);
        expect(puhelinnumeroInput.value).toEqual(puhelinnumero);
        expect(muutos.puhelinnumero).toEqual(puhelinnumero);
        expect(validointiVirheet.puhelinnumero).toBeUndefined();
    });

    it('asettaa virheet päivittäessä', async () => {
        const alkuperaiset: Yhteystiedot = {};
        let validointiVirheet: Virheet<Yhteystiedot> = {};
        const callback = (yhteystiedot: Partial<Yhteystiedot>, virheet: Virheet<Yhteystiedot>) => {
            validointiVirheet = yhteystiedot;
        };
        await renderInput(alkuperaiset, callback);
        const puhelinnumeroInput = container.querySelector("#yhteystiedot-puhelinnumero") as HTMLInputElement;
        expect(puhelinnumeroInput).not.toBeNull();
        const puhelinnumero = "";
        puhelinnumeroInput.value = puhelinnumero;
        Simulate.change(puhelinnumeroInput);
        expect(validointiVirheet.puhelinnumero).toBeDefined();
    });
});
