package fi.vm.sade.varda.rekisterointi.configuration;

import fi.vm.sade.java_utils.security.OpintopolkuCasAuthenticationFilter;
import fi.vm.sade.javautils.kayttooikeusclient.OphUserDetailsServiceImpl;
import fi.vm.sade.properties.OphProperties;
import fi.vm.sade.varda.rekisterointi.util.Constants;
import org.jasig.cas.client.validation.Cas20ProxyTicketValidator;
import org.jasig.cas.client.validation.TicketValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.cas.ServiceProperties;
import org.springframework.security.cas.authentication.CasAuthenticationProvider;
import org.springframework.security.cas.web.CasAuthenticationEntryPoint;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;

import javax.servlet.Filter;

@Configuration
@Order(2)
@EnableWebSecurity
public class HakijaWebSecurityConfig extends WebSecurityConfigurerAdapter {

    private static final String HAKIJA_ROLE = "APP_VARDAREKISTEROINTI_HAKIJA";
    private static final String HAKIJA_PATH_CLOB = "/hakija/**";

    private final OphProperties ophProperties;

    public HakijaWebSecurityConfig(OphProperties ophProperties) {
        this.ophProperties = ophProperties;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.headers().disable().csrf().disable();
        http.antMatcher(HAKIJA_PATH_CLOB).authorizeRequests()
                .anyRequest().hasRole(HAKIJA_ROLE)
                .and()
                .addFilterBefore(hakijaAuthenticationProcessingFilter(), BasicAuthenticationFilter.class)
                .exceptionHandling()
                .authenticationEntryPoint(hakijaAuthenticationEntryPoint());
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) {
        auth.authenticationProvider(hakijaAuthenticationProvider());
    }

    @Bean
    public ServiceProperties hakijaCasProperties() {
        ServiceProperties serviceProperties = new ServiceProperties();
        serviceProperties.setService(ophProperties.url("varda-rekisterointi.hakija") + "/j_spring_cas_security_check");
        serviceProperties.setSendRenew(false);
        serviceProperties.setAuthenticateAllArtifacts(true);
        return serviceProperties;
    }

    @Bean
    public Filter hakijaAuthenticationProcessingFilter() throws Exception {
        OpintopolkuCasAuthenticationFilter casAuthenticationFilter = new OpintopolkuCasAuthenticationFilter(hakijaCasProperties());
        casAuthenticationFilter.setAuthenticationManager(authenticationManager());
        casAuthenticationFilter.setFilterProcessesUrl("/hakija/j_spring_cas_security_check");
        return casAuthenticationFilter;
    }

    @Bean
    public AuthenticationEntryPoint hakijaAuthenticationEntryPoint() {
        CasAuthenticationEntryPoint casAuthenticationEntryPoint = new CasAuthenticationEntryPoint();
        casAuthenticationEntryPoint.setLoginUrl(ophProperties.url("cas.oppija.login"));
        casAuthenticationEntryPoint.setServiceProperties(hakijaCasProperties());
        return casAuthenticationEntryPoint;
    }

    @Bean
    public AuthenticationProvider hakijaAuthenticationProvider() {
        CasAuthenticationProvider casAuthenticationProvider = new CasAuthenticationProvider();
        String host = ophProperties.url("url-virkailija");
        casAuthenticationProvider.setUserDetailsService(new OphUserDetailsServiceImpl(host, Constants.CALLER_ID));
        casAuthenticationProvider.setServiceProperties(hakijaCasProperties());
        casAuthenticationProvider.setTicketValidator(hakijaTicketValidator());
        casAuthenticationProvider.setKey("varda-rekisterointi");
        return casAuthenticationProvider;
    }

    @Bean
    public TicketValidator hakijaTicketValidator() {
        Cas20ProxyTicketValidator ticketValidator = new Cas20ProxyTicketValidator(ophProperties.url("cas.oppija.url"));
        ticketValidator.setAcceptAnyProxy(true);
        return ticketValidator;
    }

}
