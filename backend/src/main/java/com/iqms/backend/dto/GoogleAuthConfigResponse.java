package com.iqms.backend.dto;

public class GoogleAuthConfigResponse {

  private final String clientId;

  public GoogleAuthConfigResponse(String clientId) {
    this.clientId = clientId;
  }

  public String getClientId() {
    return clientId;
  }
}
