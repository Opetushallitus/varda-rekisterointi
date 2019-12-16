package fi.vm.sade.varda.rekisterointi.service;

import com.github.kagkarlsson.scheduler.SchedulerClient;
import com.github.kagkarlsson.scheduler.task.Task;
import fi.vm.sade.varda.rekisterointi.RequestContext;
import fi.vm.sade.varda.rekisterointi.dto.RekisterointiAuditDto;
import fi.vm.sade.varda.rekisterointi.event.CreatedEvent;
import fi.vm.sade.varda.rekisterointi.event.UpdatedEvent;
import fi.vm.sade.varda.rekisterointi.exception.InvalidInputException;
import fi.vm.sade.varda.rekisterointi.model.Paatos;
import fi.vm.sade.varda.rekisterointi.model.PaatosBatch;
import fi.vm.sade.varda.rekisterointi.model.PaatosDto;
import fi.vm.sade.varda.rekisterointi.model.Rekisterointi;
import fi.vm.sade.varda.rekisterointi.repository.RekisterointiRepository;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@AllArgsConstructor
public class RekisterointiService {

    private static final Logger LOGGER = LoggerFactory.getLogger(RekisterointiService.class);

    private final RekisterointiRepository rekisterointiRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final SchedulerClient schedulerClient;
    @Qualifier("rekisterointiEmailTask")
    private final Task<UUID> rekisterointiEmailTask;
    @Qualifier("paatosEmailTask")
    private final Task<UUID> paatosEmailTask;
    @Qualifier("luoTaiPaivitaOrganisaatioTask")
    private final Task<UUID> luoTaiPaivitaOrganisaatioTask;

    public Iterable<Rekisterointi> listByTilaAndOrganisaatio(Rekisterointi.Tila tila, String organisaatio) {
        if (organisaatio == null || organisaatio.length() == 0) {
            return rekisterointiRepository.findByTila(tila.toString());
        }
        return rekisterointiRepository.findByTilaAndOrganisaatioContaining(tila.toString(), organisaatio);
    }

    public Iterable<Rekisterointi> listByTilaAndKunnatAndOrganisaatio(Rekisterointi.Tila tila, String[] kunnat,
                                                                      String organisaatio) {
        if (organisaatio == null || organisaatio.length() == 0) {
            return rekisterointiRepository.findByTilaAndKunnat(tila.toString(), kunnat);
        }
        return rekisterointiRepository.findByTilaAndKunnatAndOrganisaatioContaining(
                tila.toString(), kunnat, organisaatio);
    }

    @Transactional
    public UUID create(Rekisterointi rekisterointi, RequestContext requestContext) {
        Rekisterointi saved = rekisterointiRepository.save(rekisterointi);
        String taskId = taskId(rekisterointiEmailTask, saved.id);
        schedulerClient.schedule(rekisterointiEmailTask.instance(taskId, saved.id), Instant.now());
        eventPublisher.publishEvent(new CreatedEvent<>(requestContext, "rekisterointi", saved.id));
        LOGGER.info("Rekisteröinti luotu tunnuksella: {}", saved.id);
        return saved.id;
    }

    @Transactional
    public Rekisterointi resolve(String paattajaOid, PaatosDto paatosDto, RequestContext requestContext) {
        UUID rekisterointiId = paatosDto.rekisterointi;
        Paatos paatos = new Paatos(paatosDto.hyvaksytty, LocalDateTime.now(), paattajaOid, paatosDto.perustelu);
        Rekisterointi rekisterointi = rekisterointiRepository.findById(rekisterointiId).orElseThrow(
                () -> new InvalidInputException("Rekisteröintiä ei löydy, id: " + rekisterointiId));
        if (rekisterointi.tila != Rekisterointi.Tila.KASITTELYSSA) {
            throw new IllegalStateException(
                    "Päätöstä ei voi tehdä; rekisteröinti ei ole käsittelyssä-tilassa, id: " + rekisterointi.id);
        }
        RekisterointiAuditDto auditBeforeDto = new RekisterointiAuditDto(rekisterointi.tila);
        Rekisterointi saved = rekisterointiRepository.save(rekisterointi.withPaatos(paatos));
        LOGGER.info("Päätös tallennettu rekisteröinnille: {}", rekisterointi.id);
        RekisterointiAuditDto auditAfterDto = new RekisterointiAuditDto(saved.tila);
        LOGGER.debug("Rekisteröinnin {} tila päivitetty: {}", saved.id, saved.tila);
        eventPublisher.publishEvent(new UpdatedEvent<>(requestContext, "rekisterointi", saved.id,
                auditBeforeDto, auditAfterDto));

        if (paatos.hyvaksytty) {
            ajastaOrganisaationLuontiTaiPaivitys(saved);
        } else {
            ajastaHylkaysViesti(saved);
        }
        return saved;
    }

    private void ajastaOrganisaationLuontiTaiPaivitys(Rekisterointi rekisterointi) {
        schedulerClient.schedule(
                luoTaiPaivitaOrganisaatioTask.instance(taskId(luoTaiPaivitaOrganisaatioTask, rekisterointi.id), rekisterointi.id),
                Instant.now()
        );
    }

    private void ajastaHylkaysViesti(Rekisterointi rekisterointi) {
        schedulerClient.schedule(
                paatosEmailTask.instance(taskId(paatosEmailTask, rekisterointi.id), rekisterointi.id),
                Instant.now());
    }

    private String taskId(Task<UUID> task, UUID rekisterointiId) {
        return String.format("%s-%s", task.getName(), rekisterointiId.toString());
    }

    @Transactional
    public void resolveBatch(String paattajaOid, PaatosBatch paatokset, RequestContext requestContext) {
        paatokset.hakemukset.forEach(id -> resolve(
                paattajaOid,
                new PaatosDto(
                        id,
                        paatokset.hyvaksytty,
                        paatokset.perustelu
                ),
                requestContext
        ));
    }

}
