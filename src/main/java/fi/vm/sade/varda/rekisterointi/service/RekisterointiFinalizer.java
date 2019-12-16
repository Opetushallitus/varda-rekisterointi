package fi.vm.sade.varda.rekisterointi.service;

import com.github.kagkarlsson.scheduler.SchedulerClient;
import com.github.kagkarlsson.scheduler.task.Task;
import fi.vm.sade.varda.rekisterointi.exception.InvalidInputException;
import fi.vm.sade.varda.rekisterointi.model.Rekisterointi;
import fi.vm.sade.varda.rekisterointi.repository.RekisterointiRepository;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@AllArgsConstructor
public class RekisterointiFinalizer {

    private static final Logger LOGGER = LoggerFactory.getLogger(RekisterointiFinalizer.class);
    private static final long ORGANISAATIO_CACHE_KLUDGE_MINUUTIT = 15;

    private final RekisterointiRepository rekisterointiRepository;
    private final VardaOrganisaatioFinalizer vardaOrganisaatioFinalizer;
    private final VardaKayttajaFinalizer vardaKayttajaFinalizer;
    private final SchedulerClient schedulerClient;
    @Qualifier("kutsuKayttajaTask")
    private final Task<UUID> kutsuKayttajaTask;
    @Qualifier("paatosEmailTask")
    private final Task<UUID> paatosEmailTask;

    public void luoTaiPaivitaOrganisaatio(UUID rekisterointiId) {
        Rekisterointi rekisterointi = lataaRekisterointi(rekisterointiId);
        String oid = vardaOrganisaatioFinalizer.luoTaiPaivitaOrganisaatio(rekisterointi);
        if (rekisterointi.organisaatio.oid == null) {
            LOGGER.debug("Tallennetaan rekisteröintiin luodun organisaation oid: {}", oid);
            rekisterointiRepository.save(rekisterointi.withOrganisaatio(rekisterointi.organisaatio.withOid(oid)));
        }
        schedulerClient.schedule(
                kutsuKayttajaTask.instance(taskId(kutsuKayttajaTask, rekisterointiId), rekisterointiId),
                Instant.now().plus(ORGANISAATIO_CACHE_KLUDGE_MINUUTIT, ChronoUnit.MINUTES)
        );
    }

    public void kutsuKayttaja(UUID rekisterointiId) {
        Rekisterointi rekisterointi = lataaRekisterointi(rekisterointiId);
        vardaKayttajaFinalizer.kutsuKayttaja(rekisterointi);
        ajastaPaatosEmail(rekisterointiId);
    }

    private Rekisterointi lataaRekisterointi(UUID rekisterointiId) {
        return rekisterointiRepository.findById(rekisterointiId).orElseThrow(
                () -> new InvalidInputException("Rekisteröintiä ei löydy, id: " + rekisterointiId)
        );
    }

    private String taskId(Task<UUID> task, UUID rekisterointiId) {
        return String.format("%s-%s", task.getName(), rekisterointiId.toString());
    }

    private void ajastaPaatosEmail(UUID rekisterointiId) {
        schedulerClient.schedule(
                paatosEmailTask.instance(taskId(paatosEmailTask, rekisterointiId), rekisterointiId),
                Instant.now()
        );
        LOGGER.debug("Päätös-email ajastettu rekisteröinnille {}.", rekisterointiId);
    }
}
