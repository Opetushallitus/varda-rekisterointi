package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.stereotype.Component;

import java.io.*;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

@Component
public class V20191216100132__SchedulerTaskienIdMigraatio extends BaseJavaMigration {

    private static final String SELECT_REKISTEROINTI_ID_HISTORIA =
            "SELECT vanha_id, uusi_id FROM rekisterointi_id_historia";
    private static final String SELECT_SCHEDULED_TASKS =
            "SELECT task_name, task_instance, task_data FROM scheduled_tasks WHERE task_name IN ('rekisterointi-email-task', " +
                    "'paatos-email-task', 'luo-tai-paivita-organisaatio-task', 'kutsu-kayttaja-task')";
    private static final String UPDATE_SCHEDULED_TASKS =
            "UPDATE scheduled_tasks SET task_data = ? WHERE task_name = ? AND task_instance = ?";

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
        final List<Object[]> argumentit = new ArrayList<>();
        jdbcTemplate.query(
                SELECT_SCHEDULED_TASKS,
                new ScheduledTaskRowMapper()).forEach(task -> {
            Long vanhaId = deserialize(task.data);
            UUID uusiId = idMap.get(vanhaId);
            if (uusiId == null) {
                throw new IllegalStateException("Rekisteröinnin uutta tunnistetta ei löydy, vanha tunniste: " + vanhaId);
            }
            argumentit.add(new Object[] { serialize(uusiId), task.name, task.instance });
        });
        jdbcTemplate.batchUpdate(
                UPDATE_SCHEDULED_TASKS,
                argumentit
        );
    }

    private Long deserialize(byte[] data) {
        ByteArrayInputStream byteStream = new ByteArrayInputStream(data);
        try {
            ObjectInput objectInput = new ObjectInputStream(byteStream);
            return (Long) objectInput.readObject();
        } catch (IOException | ClassNotFoundException e) {
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
        }
    }

    private static class ScheduledTask {
        private final String name;
        private final String instance;
        private final byte[] data;
        private ScheduledTask(String taskName, String taskInstance, byte[] taskData) {
            this.name = taskName;
            this.instance = taskInstance;
            this.data = taskData;
        }
    }

    private static class ScheduledTaskRowMapper implements RowMapper<ScheduledTask> {

        @Override
        public ScheduledTask mapRow(ResultSet resultSet, int i) throws SQLException {
            String taskName = resultSet.getString("task_name");
            String taskInstance = resultSet.getString("task_instance");
            byte[] taskData = resultSet.getBytes("task_data");
            return new ScheduledTask(taskName, taskInstance, taskData);
        }


    }

}
