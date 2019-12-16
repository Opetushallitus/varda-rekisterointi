package fi.vm.sade.varda.rekisterointi.model;

import lombok.Value;

import java.util.List;
import java.util.UUID;

@Value
public class PaatosBatch {

    public final boolean hyvaksytty;
    public final String perustelu;
    public final List<UUID> hakemukset;

}
