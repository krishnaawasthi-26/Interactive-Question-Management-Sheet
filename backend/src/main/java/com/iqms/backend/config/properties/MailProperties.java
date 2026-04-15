package com.iqms.backend.config.properties;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

@Component
@Validated
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {

  private String host;

  @Min(value = 1, message = "APP_MAIL_PORT must be between 1 and 65535")
  @Max(value = 65535, message = "APP_MAIL_PORT must be between 1 and 65535")
  private int port = 587;

  private String username;

  private String password;

  private String fromAddress;

  private String fromName;

  private boolean auth = true;
  private boolean starttls = true;
  private boolean enabled = false;

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host == null ? "" : host.trim();
  }

  public int getPort() {
    return port;
  }

  public void setPort(int port) {
    this.port = port;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username == null ? "" : username.trim();
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password == null ? "" : password.trim();
  }

  public String getFromAddress() {
    return fromAddress;
  }

  public void setFromAddress(String fromAddress) {
    this.fromAddress = fromAddress == null ? "" : fromAddress.trim();
  }

  public String getFromName() {
    return fromName;
  }

  public void setFromName(String fromName) {
    this.fromName = fromName == null ? "" : fromName.trim();
  }

  public boolean isAuth() {
    return auth;
  }

  public void setAuth(boolean auth) {
    this.auth = auth;
  }

  public boolean isStarttls() {
    return starttls;
  }

  public void setStarttls(boolean starttls) {
    this.starttls = starttls;
  }

  public boolean isEnabled() {
    if (enabled) {
      return true;
    }
    return hasText(host) && hasText(username) && hasText(password);
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
