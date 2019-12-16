package fi.vm.sade.varda.rekisterointi.configuration;

import com.github.kagkarlsson.scheduler.task.Task;
import com.github.kagkarlsson.scheduler.task.helper.Tasks;
import fi.vm.sade.varda.rekisterointi.service.EmailService;
import fi.vm.sade.varda.rekisterointi.service.RekisterointiFinalizer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.env.Environment;

import java.util.UUID;

import static com.github.kagkarlsson.scheduler.task.schedule.Schedules.parseSchedule;

@Configuration
public class SchedulingConfiguration {

    private final EmailService emailService;
    private final RekisterointiFinalizer rekisterointiFinalizer;

    public SchedulingConfiguration(EmailService emailService,
                                   @Lazy RekisterointiFinalizer rekisterointiFinalizer) {
        this.emailService = emailService;
        this.rekisterointiFinalizer = rekisterointiFinalizer;
    }

    @Bean
    public Task<UUID> rekisterointiEmailTask() {
        return Tasks.oneTime("rekisterointi-email-task", UUID.class).execute((instance, ctx)
                -> emailService.lahetaRekisterointiEmail(instance.getData()));
    }

    @Bean
    public Task<UUID> paatosEmailTask() {
        return Tasks.oneTime("paatos-email-task", UUID.class).execute((instance, ctx)
                -> emailService.lahetaPaatosEmail(instance.getData()));
    }

    @Bean
    @ConditionalOnProperty("varda-rekisterointi.schedule.kunta-email-task")
    public Task<Void> kuntaEmailTask(Environment environment) {
        String scheduleString = environment.getRequiredProperty("varda-rekisterointi.schedule.kunta-email-task");
        return Tasks.recurring("kunta-email-task", parseSchedule(scheduleString))
                .execute((instance, ctx) -> emailService.lahetaKuntaEmail());
    }

    @Bean
    public Task<UUID> luoTaiPaivitaOrganisaatioTask() {
        return Tasks.oneTime("luo-tai-paivita-organisaatio-task", UUID.class).execute(
                (instance, ctx) -> rekisterointiFinalizer.luoTaiPaivitaOrganisaatio(instance.getData())
        );
    }

    @Bean
    public Task<UUID> kutsuKayttajaTask() {
        return Tasks.oneTime("kutsu-kayttaja-task", UUID.class).execute(
                (instance, ctx) -> rekisterointiFinalizer.kutsuKayttaja(instance.getData())
        );
    }

}
