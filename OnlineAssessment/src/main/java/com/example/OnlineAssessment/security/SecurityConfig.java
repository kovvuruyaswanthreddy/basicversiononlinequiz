package com.example.OnlineAssessment.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
            	    // Public pages
            	    .requestMatchers("/", "/index.html", "/quiz-key.html", "/class-results.html", "/faculty_help.html", "/admin_help.html", "/error").permitAll()

            	    // Static files
            	    .requestMatchers(
            	        "/*.css", "/*.js", "/*.png", "/*.jpg", "/*.jpeg",
            	        "/*.gif", "/*.ico",
            	        "/Images/**", "/model_sheets/**", "/Reference_video/**"
            	    ).permitAll()

            	    // Auth endpoints (login etc.)
            	    .requestMatchers(
            	        "/auth/**",
            	        "/student/validate",
            	        "/faculty/validate",
            	        "/admin/validate",
            	        "/departments/**", "/departments",
            	        "/ping",
            	        "/password/student/**",
            	        "/password/faculty/**",
            	        "/event/student/login",
            	        "/event/**",
            	        "/results/**",
            	        "/results/student/**"
            	    ).permitAll()

            	    // Everything else secured
            	    .anyRequest().authenticated()
            	)


            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }


    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
