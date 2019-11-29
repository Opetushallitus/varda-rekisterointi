package fi.vm.sade.varda.rekisterointi.controller.hakija;

import fi.vm.sade.properties.OphProperties;
import fi.vm.sade.varda.rekisterointi.exception.DataInconsistencyException;
import fi.vm.sade.varda.rekisterointi.exception.InvalidInputException;
import fi.vm.sade.varda.rekisterointi.model.Rekisterointi;
import fi.vm.sade.varda.rekisterointi.service.HakijaLogoutService;
import fi.vm.sade.varda.rekisterointi.service.RekisterointiService;
import fi.vm.sade.varda.rekisterointi.util.Constants;
import fi.vm.sade.varda.rekisterointi.util.RequestContextImpl;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;

import static fi.vm.sade.varda.rekisterointi.util.ServletUtils.findSessionAttribute;

@RestController
@RequestMapping(RekisterointiController.BASE_PATH)
public class RekisterointiController {

    static final String BASE_PATH = "/hakija/api/rekisteroinnit";
    private final RekisterointiService rekisterointiService;
    private final HakijaLogoutService logoutService;
    private final OphProperties properties;

    public RekisterointiController(RekisterointiService rekisterointiService, HakijaLogoutService logoutService,
                                   OphProperties properties) {
        this.rekisterointiService = rekisterointiService;
        this.logoutService = logoutService;
        this.properties = properties;
    }

    @PostMapping
    public String register(@RequestBody @Validated Rekisterointi dto, HttpServletRequest request, Authentication authentication) {
        String ytunnus = findSessionAttribute(request, Constants.SESSION_ATTRIBUTE_NAME_BUSINESS_ID, String.class).orElseThrow(
                () -> new DataInconsistencyException("Käyttäjälle ei löydy y-tunnusta istunnosta.")
        );
        if (!ytunnus.equals(dto.organisaatio.ytunnus)) {
            throw new InvalidInputException("Käyttäjällä ei ole oikeutta toimia y-tunnuksella: " + dto.organisaatio.ytunnus);
        }
        rekisterointiService.create(dto, RequestContextImpl.of(request, authentication));
        return logoutService.logout(request, properties.url("varda-rekisterointi.valmis"));
    }

}
