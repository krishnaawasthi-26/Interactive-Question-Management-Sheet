package com.iqms.backend.config;

import com.iqms.backend.config.properties.MailProperties;
import java.util.Properties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

  @Bean
  @Primary
  public JavaMailSender javaMailSender(MailProperties mailProperties) {
    JavaMailSenderImpl sender = new JavaMailSenderImpl();
    sender.setHost(mailProperties.getHost());
    sender.setPort(mailProperties.getPort());
    sender.setUsername(mailProperties.getUsername());
    sender.setPassword(mailProperties.getPassword());

    Properties props = sender.getJavaMailProperties();
    props.put("mail.transport.protocol", "smtp");
    props.put("mail.smtp.auth", Boolean.toString(mailProperties.isAuth()));
    props.put("mail.smtp.starttls.enable", Boolean.toString(mailProperties.isStarttls()));
    props.put("mail.smtp.connectiontimeout", "5000");
    props.put("mail.smtp.timeout", "5000");
    props.put("mail.smtp.writetimeout", "5000");

    return sender;
  }
}
