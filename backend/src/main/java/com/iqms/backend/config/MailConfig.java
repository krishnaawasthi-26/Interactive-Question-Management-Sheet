package com.iqms.backend.config;

import com.iqms.backend.config.properties.MailProperties;
import java.util.Properties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

  @Bean
  public JavaMailSender javaMailSender(MailProperties mailProperties) {
    JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
    mailSender.setHost(mailProperties.getHost());
    mailSender.setPort(mailProperties.getPort());
    mailSender.setUsername(mailProperties.getUsername());
    mailSender.setPassword(mailProperties.getPassword());

    Properties props = mailSender.getJavaMailProperties();
    props.put("mail.smtp.auth", String.valueOf(mailProperties.isAuth()));
    props.put("mail.smtp.starttls.enable", String.valueOf(mailProperties.isStarttls()));

    return mailSender;
  }
}
