package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.stereotype.Component;

import java.io.*;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
public class V20191216100132__SchedulerTaskienIdMigraatio extends BaseJavaMigration {

    private static final Logger LOGGER = LoggerFactory.getLogger(
            V20191216100132__SchedulerTaskienIdMigraatio.class);
    private static final String SELECT_REKISTEROINTI_ID_HISTORIA =
            "SELECT vanha_id, uusi_id FROM rekisterointi_id_historia";
    private static final String SELECT_SCHEDULED_TASKS =
            "SELECT task_name, task_data FROM scheduled_tasks WHERE task_name IN ('rekisterointi-email-task', " +
                    "'paatos-email-task', 'luo-tai-paivita-organisaatio-task', 'kutsu-kayttaja-task')";
    @Override
    public void migrate(Context context) throws Exception {
        JdbcTemplate jdbcTemplate = new JdbcTemplate(
                new SingleConnectionDataSource(context.getConnection(), true));
        Map<Long, UUID> idMap = idMap(jdbcTemplate);
        prosessoiTaskit(jdbcTemplate, idMap);
    }

    private Map<Long, UUID> idMap(JdbcTemplate jdbcTemplate) {
        Map<Long, UUID> idMap = new HashMap<>();
        jdbcTemplate.query(
                SELECT_REKISTEROINTI_ID_HISTORIA,
                new RekisterointiRowCallbackHandler(idMap)
        );
        return idMap;
    }

    private void prosessoiTaskit(JdbcTemplate jdbcTemplate, Map<Long, UUID> idMap) {
        jdbcTemplate.query(
                SELECT_SCHEDULED_TASKS,
                new ScheduledTaskRowCallbackHandler(idMap));
    }

    private static class RekisterointiRowCallbackHandler implements RowCallbackHandler {

        private final Map<Long, UUID> idMap;

        private RekisterointiRowCallbackHandler(Map<Long, UUID> idMap) {
            this.idMap = idMap;
        }

        @Override
        public void processRow(ResultSet resultSet) throws SQLException {
            Long vanhaId = resultSet.getLong("vanha_id");
            UUID uusiId = resultSet.getObject("uusi_id", UUID.class);
            idMap.put(vanhaId, uusiId);
            LOGGER.debug("Luettu id-historiarivi: {} -> {}", vanhaId, uusiId);
        }
    }

    private static class ScheduledTaskRowCallbackHandler implements RowCallbackHandler {

        private final Map<Long, UUID> idMap;

        private ScheduledTaskRowCallbackHandler(Map<Long, UUID> idMap) {
            this.idMap = idMap;
        }

        @Override
        public void processRow(ResultSet resultSet) throws SQLException {
            String taskName = resultSet.getString("task_name");
            byte[] taskData = resultSet.getBytes("task_data");
            Long vanhaId = deserialize(taskData);
            LOGGER.debug("Käsitellään task '{}' rekisteröinnille {}.", taskName, vanhaId);
            UUID uusiId = idMap.get(vanhaId);
            if (uusiId == null) {
                throw new IllegalStateException("Rekisteröinnin uutta tunnistetta ei löydy, vanha tunniste: " + vanhaId);
            }
            resultSet.updateBytes("task_data", serialize(uusiId));
            LOGGER.info("Asetettu taskin '{}' rekisteröintitunniste: {} -> {}", taskName, vanhaId, uusiId);
        }

        private Long deserialize(byte[] data) {
            ByteArrayInputStream byteStream = new ByteArrayInputStream(data);
            try {
                ObjectInput objectInput = new ObjectInputStream(byteStream);
                return objectInput.readLong();
            } catch (IOException e) {
                throw new IllegalStateException("Rekisteröinnin tunnisteen lukeminen task datasta epäonnistui", e);
            }
        }

        private byte[] serialize(UUID uuid) {
            ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
            try {
                ObjectOutput objectOutput = new ObjectOutputStream(byteStream);
                objectOutput.writeObject(uuid);
                objectOutput.flush();
                return byteStream.toByteArray();
            } catch (IOException e) {
                throw new IllegalStateException("Rekisteröinnin uuden tunnisteen muuntaminen tavuiksi epäonnistui", e);
            }
        }
    }

}
