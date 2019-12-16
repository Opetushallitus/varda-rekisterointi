package fi.vm.sade.varda.rekisterointi.service;

import fi.vm.sade.varda.rekisterointi.Template;
import fi.vm.sade.varda.rekisterointi.client.KayttooikeusClient;
import fi.vm.sade.varda.rekisterointi.client.OrganisaatioClient;
import fi.vm.sade.varda.rekisterointi.client.ViestintaClient;
import fi.vm.sade.varda.rekisterointi.model.*;
import fi.vm.sade.varda.rekisterointi.repository.RekisterointiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.Function;
import java.util.stream.StreamSupport;

import static java.util.function.Function.identity;
import static java.util.stream.Collectors.*;

@Service
@RequiredArgsConstructor
public class EmailService {

    public static final List<Locale> LOCALES = List.of(new Locale("fi"), new Locale("sv"));
    private static final String SUBJECT_DELIMITER = " / ";

    private final RekisterointiRepository rekisterointiRepository;
    private final TemplateService templateService;
    private final MessageSource messageSource;
    private final ViestintaClient viestintaClient;
    private final KayttooikeusClient kayttooikeusClient;
    private final OrganisaatioClient organisaatioClient;

    public void lahetaRekisterointiEmail(UUID id) {
        rekisterointiRepository.findById(id).ifPresent(rekisterointi -> {
            lahetaRekisterointiEmail(rekisterointi);
            lahetaRekisterointiEmail(rekisterointi.kayttaja);
        });
    }

    private void lahetaRekisterointiEmail(Rekisterointi rekisterointi) {
        EmailDto email = EmailDto.builder()
                .emails(rekisterointi.sahkopostit)
                .message(luoViesti(rekisterointi))
                .build();
        viestintaClient.save(email, false);
    }

    private EmailMessageDto luoViesti(Rekisterointi rekisterointi) {
        String organisaatioNimi = rekisterointi.organisaatio.ytjNimi.nimi;
        return EmailMessageDto.builder()
                .subject(subjectToAllLanguages("rekisteroityminen.kayttaja.otsikko"))
                .body(templateService.getContent(Template.REKISTEROITYMINEN_KAYTTAJA, new Locale("fi"),
                        Map.of("messageSource", messageSource, "locales", LOCALES, "organisaatioNimi", organisaatioNimi)))
                .html(true)
                .build();
    }

    private void lahetaRekisterointiEmail(Kayttaja kayttaja) {
        Locale locale = new Locale(kayttaja.asiointikieli);
        String body = templateService.getContent(Template.REKISTEROITYMINEN_PAAKAYTTAJA, locale,
                Map.of("etunimi", kayttaja.etunimi));
        EmailDto email = EmailDto.builder()
                .email(kayttaja.sahkoposti)
                .message(EmailMessageDto.builder()
                        .subject(messageSource.getMessage("rekisteroityminen.paakayttaja.otsikko", null, locale))
                        .body(body)
                        .html(true)
                        .build())
                .build();
        viestintaClient.save(email, false);
    }

    public void lahetaPaatosEmail(UUID id) {
        rekisterointiRepository.findById(id).ifPresent(rekisterointi -> {
            String organisaatioNimi = rekisterointi.organisaatio.ytjNimi.nimi;
            EmailDto email = EmailDto.builder()
                    .emails(rekisterointi.sahkopostit)
                    .message(luoViesti(rekisterointi.paatos, organisaatioNimi))
                    .build();
            viestintaClient.save(email, false);
        });
    }

    private EmailMessageDto luoViesti(Paatos paatos, String organisaatioNimi) {
        if (paatos.hyvaksytty) {
            return EmailMessageDto.builder()
                    .subject(subjectToAllLanguages("rekisteroityminen.hyvaksytty.otsikko"))
                    .body(templateService.getContent(Template.REKISTEROITYMINEN_HYVAKSYTTY, new Locale("fi"),
                            Map.of("messageSource", messageSource, "locales", LOCALES, "organisaatioNimi", organisaatioNimi)))
                    .html(true)
                    .build();
        }
        return EmailMessageDto.builder()
                .subject(subjectToAllLanguages("rekisteroityminen.hylatty.otsikko"))
                .body(templateService.getContent(Template.REKISTEROITYMINEN_HYLATTY, new Locale("fi"),
                        Map.of("messageSource", messageSource, "locales", LOCALES, "organisaatioNimi", organisaatioNimi, "perustelu", paatos.perustelu)))
                .html(true)
                .build();
    }

    public void lahetaKuntaEmail() {
        Iterable<Rekisterointi> kasittelemattomat = rekisterointiRepository.findByTila(Rekisterointi.Tila.KASITTELYSSA.toString());
        Set<String> kunnat = StreamSupport.stream(kasittelemattomat.spliterator(), false)
                .flatMap(rekisterointi -> rekisterointi.kunnat.stream()).collect(toSet());
        Map<VirkailijaDto, Long> virkailijat = getVirkailijaByKunta(kunnat);
        virkailijat.forEach(this::lahetaKuntaEmail);
    }

    private Map<VirkailijaDto, Long> getVirkailijaByKunta(Set<String> kunnat) {
        return kunnat.stream()
                .map(kunta -> getOrganisaatioByKunta(kunta).stream().map(organisaatio -> organisaatio.oid))
                .flatMap(organisaatioOid -> getVirkailijaByOrganisaatio(organisaatioOid.collect(toSet())).stream())
                .filter(virkailija -> virkailija.sahkoposti != null && !virkailija.sahkoposti.isEmpty())
                .collect(groupingBy(identity(), counting()));
    }

    private Collection<OrganisaatioV4Dto> getOrganisaatioByKunta(String kunta) {
        OrganisaatioCriteria organisaatioCriteria = new OrganisaatioCriteria();
        organisaatioCriteria.aktiiviset = true;
        organisaatioCriteria.yritysmuoto = List.of("Kunta");
        organisaatioCriteria.kunta = List.of(kunta);
        return organisaatioClient.listBy(organisaatioCriteria);
    }

    private Collection<VirkailijaDto> getVirkailijaByOrganisaatio(Set<String> organisaatioOids) {
        VirkailijaCriteria virkailijaCriteria = new VirkailijaCriteria();
        virkailijaCriteria.passivoitu = false;
        virkailijaCriteria.duplikaatti = false;
        virkailijaCriteria.organisaatioOids = organisaatioOids;
        virkailijaCriteria.kayttooikeudet = Map.of("YKSITYISTEN_REKISTEROITYMINEN", List.of("CRUD"));
        return kayttooikeusClient.listVirkailijaBy(virkailijaCriteria);
    }

    private void lahetaKuntaEmail(VirkailijaDto virkailija, Long organisaatioLkm) {
        Locale locale = new Locale(Optional.ofNullable(virkailija.asiointikieli).orElse("fi"));
        String subject = messageSource.getMessage("rekisteroityminen.kunta.otsikko", null, locale);
        Map<String, Object> variables = Map.of("organisaatioLkm", organisaatioLkm);
        String body = templateService.getContent(Template.REKISTEROITYMINEN_KUNTA, locale, variables);
        EmailDto email = EmailDto.builder()
                .email(virkailija.sahkoposti)
                .message(EmailMessageDto.builder()
                        .subject(subject)
                        .body(body)
                        .html(true)
                        .build())
                .build();
        viestintaClient.save(email, false);
    }

    private String subjectToAllLanguages(String code) {
        return subjectToAllLanguages(locale -> messageSource.getMessage(code, null, locale));
    }

    private String subjectToAllLanguages(Function<Locale, String> messageByLocale) {
        return LOCALES.stream().map(messageByLocale::apply).collect(joining(SUBJECT_DELIMITER));
    }

}
