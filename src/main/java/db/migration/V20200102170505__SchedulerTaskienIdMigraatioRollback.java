package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;

import java.io.*;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

public class V20200102170505__SchedulerTaskienIdMigraatioRollback extends BaseJavaMigration {


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
        Map<UUID, Long> idMap = idMap(jdbcTemplate);
        prosessoiTaskit(jdbcTemplate, idMap);
    }

    private Map<UUID, Long> idMap(JdbcTemplate jdbcTemplate) {
        Map<UUID, Long> idMap = new HashMap<>();
        jdbcTemplate.query(
                SELECT_REKISTEROINTI_ID_HISTORIA,
                new V20200102170505__SchedulerTaskienIdMigraatioRollback.RekisterointiRowCallbackHandler(idMap)
        );
        return idMap;
    }

    private void prosessoiTaskit(JdbcTemplate jdbcTemplate, Map<UUID, Long> idMap) {
        final List<Object[]> argumentit = new ArrayList<>();
        jdbcTemplate.query(
                SELECT_SCHEDULED_TASKS,
                new V20200102170505__SchedulerTaskienIdMigraatioRollback.ScheduledTaskRowMapper()).forEach(task -> {
            UUID vanhaId = deserialize(task.data);
            Long uusiId = idMap.get(vanhaId);
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

    private UUID deserialize(byte[] data) {
        ByteArrayInputStream byteStream = new ByteArrayInputStream(data);
        try {
            ObjectInput objectInput = new ObjectInputStream(byteStream);
            return (UUID) objectInput.readObject();
        } catch (IOException | ClassNotFoundException e) {
            throw new IllegalStateException("Rekisteröinnin tunnisteen lukeminen task datasta epäonnistui", e);
        }
    }

    private byte[] serialize(Long id) {
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        try {
            ObjectOutput objectOutput = new ObjectOutputStream(byteStream);
            objectOutput.writeObject(id);
            objectOutput.flush();
            return byteStream.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Rekisteröinnin uuden tunnisteen muuntaminen tavuiksi epäonnistui", e);
        }
    }

    private static class RekisterointiRowCallbackHandler implements RowCallbackHandler {

        private final Map<UUID, Long> idMap;

        private RekisterointiRowCallbackHandler(Map<UUID, Long> idMap) {
            this.idMap = idMap;
        }

        @Override
        public void processRow(ResultSet resultSet) throws SQLException {
            // uh oh, makes sense: vanha <-> uusi, koska alkuperäisen migraation uusi on tuleva vanha...
            UUID vanhaId = resultSet.getObject("uusi_id", UUID.class);
            Long uusiId = resultSet.getLong("vanha_id");
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

    private static class ScheduledTaskRowMapper implements RowMapper<V20200102170505__SchedulerTaskienIdMigraatioRollback.ScheduledTask> {

        @Override
        public V20200102170505__SchedulerTaskienIdMigraatioRollback.ScheduledTask mapRow(ResultSet resultSet, int i) throws SQLException {
            String taskName = resultSet.getString("task_name");
            String taskInstance = resultSet.getString("task_instance");
            byte[] taskData = resultSet.getBytes("task_data");
            return new V20200102170505__SchedulerTaskienIdMigraatioRollback.ScheduledTask(taskName, taskInstance, taskData);
        }


    }

}
