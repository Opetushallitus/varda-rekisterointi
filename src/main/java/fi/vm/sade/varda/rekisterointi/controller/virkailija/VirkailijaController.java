package fi.vm.sade.varda.rekisterointi.controller.virkailija;

import fi.vm.sade.properties.OphProperties;
import fi.vm.sade.varda.rekisterointi.client.OrganisaatioClient;
import fi.vm.sade.varda.rekisterointi.model.*;
import fi.vm.sade.varda.rekisterointi.service.OrganisaatioService;
import fi.vm.sade.varda.rekisterointi.service.RekisterointiService;
import fi.vm.sade.varda.rekisterointi.util.Constants;
import fi.vm.sade.varda.rekisterointi.util.RequestContextImpl;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static fi.vm.sade.varda.rekisterointi.util.FunctionalUtils.exceptionToEmptySupplier;

@RestController
@PreAuthorize(VirkailijaController.ROOLI_TARKISTUS)
@RequestMapping(VirkailijaController.BASE_PATH)
@RequiredArgsConstructor
public class VirkailijaController {

    static final String BASE_PATH = "/virkailija/api";
    static final String REKISTEROINNIT_PATH = "/rekisteroinnit";
    static final String PAATOKSET_PATH = "/paatokset";
    static final String PAATOKSET_BATCH_PATH = PAATOKSET_PATH + "/batch";
    static final String VIRKAILIJA_ROOLI = "ROLE_" + Constants.VIRKAILIJA_ROLE;
    static final String ROOLI_TARKISTUS = "hasAnyRole('" + VIRKAILIJA_ROOLI + "')";

    private static final String ORGANISAATIOT_PATH = "/organisaatiot";
    private static final String OPH_OID = "1.2.246.562.10.00000000001"; // TODO: ei-kovakoodattuna jostain?
    private static final Logger LOGGER = LoggerFactory.getLogger(VirkailijaController.class);

    private final OrganisaatioClient organisaatioClient;
    private final OrganisaatioService organisaatioService;
    private final RekisterointiService rekisterointiService;
    private final OphProperties properties;

    /**
     * Hakee organisaation y-tunnuksella.
     *
     * @param ytunnus   y-tunnus
     *
     * @return organisaatio (mahdollisesti tyhjä)
     */
    @GetMapping(ORGANISAATIOT_PATH + "/ytunnus={ytunnus}")
    @ApiOperation("Hae organisaatio y-tunnuksella")
    @ApiResponse(
            code = 200,
            message = "Organisaatio, tyhjä mikäli ei löytynyt",
            response = Organisaatio.class
    )
    public Organisaatio getOrganisaatioByYtunnus(@ApiParam("y-tunnus") @PathVariable String ytunnus) {
        return organisaatioService.muunnaV4Dto(organisaatioClient.getV4ByYtunnus(ytunnus)
                .or(exceptionToEmptySupplier(() -> organisaatioClient.getV4ByYtunnusFromYtj(ytunnus)))
                .orElseGet(() -> OrganisaatioV4Dto.of(ytunnus, "")));
    }

    /**
     * Luo rekisteröintihakemuksen.
     *
     * @param dto       rekisteröintihakemus
     * @param request   HTTP-pyyntö
     * @return paluuosoite.
     */
    @PostMapping(REKISTEROINNIT_PATH)
    @PreAuthorize("hasPermission(null, 'rekisterointi', 'create')")
    @ApiOperation("Luo rekisteröintihakemus")
    @ApiResponse(
            code = 200,
            message = "Onnistuneen hakemuksen jälkeinen paluuosoite",
            response = String.class
    )
    public String luoRekisterointi(
            @ApiParam("rekisteröintihakemus") @RequestBody @Validated RekisterointiDto dto,
            HttpServletRequest request) {
        rekisterointiService.create(Rekisterointi.from(dto), RequestContextImpl.of(request));
        return properties.url("varda-rekisterointi.virkailija");
    }

    /**
     * Listaa rekisteröintihakemukset tilan perusteella. Tuloksia voi rajata antamalla
     * organisaatioon kohdistuvan hakutermin.
     *
     * @param authentication    autentikointi
     * @param tila              hakemusten tila
     * @param hakutermi         hakutermi organisaatiolle
     * @return löytyneet hakemukset.
     */
    @GetMapping(REKISTEROINNIT_PATH)
    @ApiOperation("Listaa rekisteröintihakemukset")
    @ApiResponse(
            code = 200,
            message = "ehtoja vastaavat rekisteröintihakemukset",
            response = Rekisterointi.class,
            responseContainer = "java.lang.Iterable"
    )
    public Iterable<Rekisterointi> listaaRekisteroinnit(
            Authentication authentication,
            @ApiParam("rekisteröintien tila") @RequestParam("tila") Rekisterointi.Tila tila,
            @ApiParam("rekisteröityvän organisaation nimi (tai sen osa)") @RequestParam(value = "hakutermi", required = false) String hakutermi) {
        List<String> organisaatioOidit = haeOrganisaatioOidit(authentication.getAuthorities());
        if (onOphVirkailija(organisaatioOidit)) {
            LOGGER.debug("Käyttäjällä on oikeus nähdä kaikki rekisteröinnit.");
            return rekisterointiService.listByTilaAndOrganisaatio(tila, hakutermi);
        }
        List<String> kunnat = virkailijanKunnat(organisaatioOidit);
        if (kunnat.isEmpty()) {
            LOGGER.debug("Käyttäjällä ei ole oikeutta nähdä yhdenkään kunnan rekisteröintejä.");
            return List.of();
        }
        return rekisterointiService.listByTilaAndKunnatAndOrganisaatio(
                tila, kunnat.toArray(new String[0]), hakutermi);
    }

    /**
     * Luo päätöksen hakemukselle.
     *
     * @param authentication    autentikointi
     * @param paatos            päätös
     * @param request           HTTP-pyyntö
     * @return rekisteröintihakemus, jolle päätös luotiin.
     */
    @PostMapping(PAATOKSET_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    @ApiOperation("Luo päätös hakemukselle")
    @ApiResponse(
            code = 201,
            message = "Päätöksen saanut rekisteröintihakemus",
            response = Rekisterointi.class
    )
    public Rekisterointi luoPaatos(
            Authentication authentication,
            @ApiParam("luotava päätös") @RequestBody @Validated PaatosDto paatos,
            HttpServletRequest request) {
        return rekisterointiService.resolve(authentication.getName(), paatos, RequestContextImpl.of(request));
    }

    /**
     * Luo päätöksen useammalle hakemukselle kerralla.
     *
     * @param authentication    autentikointi
     * @param paatokset         luotavat päätökset
     * @param request           HTTP-pyyntö
     */
    @PostMapping(PAATOKSET_BATCH_PATH)
    @ResponseStatus(HttpStatus.CREATED)
    @ApiOperation("Luo useampi päätös")
    @ApiResponse(
            code = 201,
            message = "Päätökset luotu onnistuneesti"
    )
    public void luoPaatokset(
            Authentication authentication,
            @ApiParam("luotavat päätökset") @RequestBody @Validated PaatosBatch paatokset,
            HttpServletRequest request) {
        rekisterointiService.resolveBatch(authentication.getName(), paatokset, RequestContextImpl.of(request));
    }

    List<String> haeOrganisaatioOidit(Collection<? extends GrantedAuthority> grantedAuthorities) {
        return grantedAuthorities.stream()
                .filter(grantedAuthority -> grantedAuthority.getAuthority().contains(Constants.VIRKAILIJA_ROLE + '_'))
                .map(grantedAuthority -> {
                    String authority = grantedAuthority.getAuthority();
                    return authority.substring(authority.lastIndexOf('_') + 1);
                }).collect(Collectors.toList());
    }

    private boolean onOphVirkailija(List<String> organisaatioOidit) {
        return organisaatioOidit.contains(OPH_OID);
    }

    private List<String> virkailijanKunnat(List<String> organisaatioOidit) {
        // TODO: batch API useammalle kunnalle tai cachetus?
        return organisaatioOidit.stream()
                .map(organisaatioClient::getKuntaByOid)
                .filter(Optional::isPresent)
                .map(optOrganisaatio -> optOrganisaatio.get().kotipaikkaUri)
                .collect(Collectors.toList());
    }
}
