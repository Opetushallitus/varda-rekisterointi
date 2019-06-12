package fi.vm.sade.varda.rekisterointi.controller;

import fi.vm.sade.properties.OphProperties;
import fi.vm.sade.suomifi.valtuudet.OrganisationDto;
import fi.vm.sade.suomifi.valtuudet.SessionDto;
import fi.vm.sade.suomifi.valtuudet.ValtuudetClient;
import fi.vm.sade.suomifi.valtuudet.ValtuudetType;
import fi.vm.sade.varda.rekisterointi.NameContainer;
import fi.vm.sade.varda.rekisterointi.client.OrganisaatioClient;
import fi.vm.sade.varda.rekisterointi.model.Organisaatio;
import fi.vm.sade.varda.rekisterointi.model.Valtuudet;
import org.springframework.context.annotation.Scope;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.View;
import org.springframework.web.servlet.view.RedirectView;

import java.security.Principal;
import java.util.Optional;

@Controller
@RequestMapping("/hakija")
@Scope("session")
public class ValtuudetController {

    private final OphProperties properties;
    private final Valtuudet valtuudet;
    private final ValtuudetClient valtuudetClient;
    private final OrganisaatioClient organisaatioClient;

    public ValtuudetController(OphProperties properties, Valtuudet valtuudet, ValtuudetClient valtuudetClient, OrganisaatioClient organisaatioClient) {
        this.properties = properties;
        this.valtuudet = valtuudet;
        this.valtuudetClient = valtuudetClient;
        this.organisaatioClient = organisaatioClient;
    }

    @GetMapping("/valtuudet/redirect")
    public View start(Principal principal) {
        String nationalIdentificationNumber = principal.getName();
        String callbackUrl = properties.url("varda-rekisterointi.hakija.valtuudet.callback");
        SessionDto session = valtuudetClient.createSession(ValtuudetType.ORGANISATION, nationalIdentificationNumber);
        String redirectUrl = valtuudetClient.getRedirectUrl(session.userId, callbackUrl, "fi");

        valtuudet.sessionId = session.sessionId;
        valtuudet.callbackUrl = callbackUrl;

        return new RedirectView(redirectUrl);
    }

    @GetMapping("/valtuudet/callback")
    public View end(@RequestParam(required = false) String code) {
        if (code == null) {
            String redirectUrl = properties.url("varda-rekisterointi.hakija.logout");
            return new RedirectView(redirectUrl);
        }

        String accessToken = valtuudetClient.getAccessToken(code, valtuudet.callbackUrl);
        OrganisationDto organisation = valtuudetClient.getSelectedOrganisation(valtuudet.sessionId, accessToken);
        valtuudet.businessId = organisation.identifier;

        Organisaatio organisaatio = organisaatioClient.getByYtunnus(valtuudet.businessId)
                .or(() -> organisaatioClient.getByYtunnusFromYtj(valtuudet.businessId))
                .orElseGet(() -> Organisaatio.of(organisation));
        valtuudet.organisaatio = organisaatio;

        String redirectUrl = properties.url("varda-rekisterointi.hakija");
        return new RedirectView(redirectUrl);
    }

    @GetMapping
    public String getIndex(Model model, Authentication authentication) {
        String logoutUrl = properties.url("varda-rekisterointi.hakija.logout");
        model.addAttribute("logoutUrl", logoutUrl);

        model.addAttribute("nationalIdentificationNumber", authentication.getName());
        if (authentication.getDetails() instanceof NameContainer) {
            NameContainer nameContainer = (NameContainer) authentication.getDetails();
            model.addAttribute("givenName", nameContainer.getGivenName());
            model.addAttribute("surname", nameContainer.getSurname());
        }

        model.addAttribute("businessId", valtuudet.businessId);
        String organisationName = Optional.ofNullable(valtuudet.organisaatio.nimi)
                .map(nimi -> nimi.get("fi")).orElse("");
        model.addAttribute("organisationName", organisationName);

        return "hakija";
    }

}