package fi.vm.sade.varda.rekisterointi.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasksHealthIndicator implements HealthIndicator {

    public static final String CONSECUTIVE_FAILURES_DETAIL_KEY = "maxConsecutiveFailures";
    private static final String MAX_CONSECUTIVE_FAILURES_QUERY =
            "SELECT MAX(consecutive_failures) FROM scheduled_tasks " +
            "WHERE (CURRENT_TIMESTAMP - last_failure) < INTERVAL '24 hours'";

    private final JdbcTemplate jdbcTemplate;

    public ScheduledTasksHealthIndicator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Health health() {
        int consecutiveFailures = queryMaxConsecutiveFailures();
        return Health.up().withDetail(CONSECUTIVE_FAILURES_DETAIL_KEY, consecutiveFailures).build();
    }

    private int queryMaxConsecutiveFailures() {
        Integer result = jdbcTemplate.query(MAX_CONSECUTIVE_FAILURES_QUERY, resultSet -> {
            if (resultSet.next()) {
                return resultSet.getInt(1);
            }
            throw new IllegalStateException("Result set was empty");
        });
        assert result != null;
        return result;
    }

}
