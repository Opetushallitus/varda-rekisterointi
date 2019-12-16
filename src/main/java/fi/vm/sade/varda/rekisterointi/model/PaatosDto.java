package fi.vm.sade.varda.rekisterointi.model;

import lombok.Value;

import javax.validation.constraints.NotNull;
import java.util.UUID;

@Value
public class PaatosDto {

    @NotNull
    public final UUID rekisterointi;
    public final boolean hyvaksytty;
    public final String perustelu;

}
