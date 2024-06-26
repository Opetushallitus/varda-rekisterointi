package fi.vm.sade.varda.rekisterointi.service;

import fi.vm.sade.varda.rekisterointi.client.OrganisaatioClient;
import fi.vm.sade.varda.rekisterointi.exception.InvalidInputException;
import fi.vm.sade.varda.rekisterointi.model.Organisaatio;
import fi.vm.sade.varda.rekisterointi.model.OrganisaatioDto;
import fi.vm.sade.varda.rekisterointi.model.Rekisterointi;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RekisterointiOrganisaatioFinalizer {

    static final String VARDA_ORGANISAATIOTYYPPI = "organisaatiotyyppi_07";
    static final String JOTPA_ORGANISAATIOTYYPPI = "organisaatiotyyppi_01";
    static final String JOTPA_CHILD_OPPILAITOSTYYPPI = "oppilaitostyyppi_xx";
    static final String REKISTEROINTITYYPPI_VARDA = "varda";
    static final String REKISTEROINTITYYPPI_JOTPA = "jotpa";
    private static final Logger LOGGER = LoggerFactory.getLogger(RekisterointiOrganisaatioFinalizer.class);

    private final OrganisaatioService organisaatioService;
    private final OrganisaatioClient organisaatioClient;

    /**
     * Luo tai päivitä organisaatio rekisteröinnin perusteella. Mikäli organisaatio on jo
     * olemassa, sille lisätään tarvittaessa varhaiskasvatuksen organisaatiotyyppi.
     *
     * @param rekisterointi hyväksytty rekisteröinti
     * @return organisaation OID.
     */
    @Transactional
    public String luoTaiPaivitaOrganisaatio(Rekisterointi rekisterointi) {
        Organisaatio organisaatio = rekisterointi.organisaatio;
        String oid = Optional.ofNullable(organisaatio.oid)
                .or(() -> organisaatioClient.getOrganisaatioByYtunnus(organisaatio.ytunnus).map(o -> {
                    LOGGER.info("Löydettiin olemassoleva organisaatio {} ytunnuksella {}", o.oid, o.ytunnus);
                    return o.oid;
                }))
                .orElse(null);
        if (oid != null) {
            LOGGER.info("Päivitetään organisaatiota: {}", oid);
            if (rekisterointi.tyyppi.equals(REKISTEROINTITYYPPI_VARDA)) {
                paivitaVardaTiedot(oid);
            } else if(rekisterointi.tyyppi.equals(REKISTEROINTITYYPPI_JOTPA)) {
                paivitaJotpaTiedot(oid);
            }
            return oid;
        } else {
            LOGGER.info("Luodaan organisaatio nimellä: {}", organisaatio.ytjNimi.nimi);
            OrganisaatioDto createdOrg = organisaatioClient.create(organisaatioService.muunnaOrganisaatio(organisaatio));
            LOGGER.info("Luotu uusi organisaatio {} rekisteröinnin pohjalta.", createdOrg.oid);
            if (rekisterointi.tyyppi.equals(REKISTEROINTITYYPPI_JOTPA)) {
                LOGGER.info("Luodaan uusi jotpa aliorganisaatio oppilaitostypille ei tiedossa");
                OrganisaatioDto jotpaChild = organisaatioClient.create(OrganisaatioDto.jotpaChildOppilaitosFrom(createdOrg));
                LOGGER.info("Luotu uusi jotpa aliorganisaatio {}", jotpaChild.oid);

            }
            return createdOrg.oid;
        }
    }

    private void paivitaVardaTiedot(String organisaatioOid) {
        OrganisaatioDto dto = organisaatioClient.getOrganisaatioByOid(organisaatioOid).orElseThrow(
                () -> new InvalidInputException("Organisaatiota ei löydy, oid: " + organisaatioOid)
        );
        if (!dto.tyypit.contains(VARDA_ORGANISAATIOTYYPPI)) {
            dto.tyypit = new HashSet<>(dto.tyypit);
            dto.tyypit.add(VARDA_ORGANISAATIOTYYPPI);
            dto.lakkautusPvm = null;
            organisaatioClient.save(dto);
            LOGGER.info("Lisätty varhaiskasvatuksen organisaatiotyyppi organisaatiolle, oid: {}", organisaatioOid);
        } else if (dto.lakkautusPvm != null) {
            dto.lakkautusPvm = null;
            organisaatioClient.save(dto);
            LOGGER.info("Organisaation lakkautuspäivämäärä poistettu, oid: {}", organisaatioOid);
        } else {
            LOGGER.info("Organisaatioon ei tarvittu muutoksia, oid: {}", organisaatioOid);
        }
    }

    private void paivitaJotpaTiedot(String organisaatioOid) {
        OrganisaatioDto dto = organisaatioClient.getOrganisaatioByOid(organisaatioOid).orElseThrow(
                () -> new InvalidInputException("Organisaatiota ei löydy, oid: " + organisaatioOid)
        );
        if (!dto.tyypit.contains(JOTPA_ORGANISAATIOTYYPPI)) {
            dto.tyypit = new HashSet<>(dto.tyypit);
            dto.tyypit.add(JOTPA_ORGANISAATIOTYYPPI);
            dto.lakkautusPvm = null;
            dto = organisaatioClient.save(dto);
            LOGGER.info("Lisätty jotpa organisaatiotyyppi organisaatiolle, oid: {}", organisaatioOid);
        } else if (dto.lakkautusPvm != null) {
            dto.lakkautusPvm = null;
            dto = organisaatioClient.save(dto);
            LOGGER.info("Organisaation lakkautuspäivämäärä poistettu, oid: {}", organisaatioOid);
        } else {
            LOGGER.info("Organisaatioon ei tarvittu muutoksia, oid: {}", organisaatioOid);
        }

        Collection<OrganisaatioDto> jotpaOrgChilden = organisaatioClient.getOrganisaatioJalkelaisetByOid(dto.oid);
        if (jotpaOrgChilden.stream().noneMatch(o -> o.oppilaitostyyppi.equals(JOTPA_CHILD_OPPILAITOSTYYPPI))) {
           LOGGER.info("Jotpa-organisaation päivityksen jälkeen huomattu että aliorganisaatio puuttuu, jotpa organisaation oid: {}", organisaatioOid);
           OrganisaatioDto jotpaOppilaitosDto = OrganisaatioDto.jotpaChildOppilaitosFrom(dto);
           OrganisaatioDto jotpaSaved = organisaatioClient.save(jotpaOppilaitosDto);
           LOGGER.info("Luotu puuttuva oppilaitostyyppinen aliorganisaatio(uuden oid: {}) Jotpa organisaatiolle(jotpa oid: {})", jotpaSaved.oid, organisaatioOid);
        }
    }
}
