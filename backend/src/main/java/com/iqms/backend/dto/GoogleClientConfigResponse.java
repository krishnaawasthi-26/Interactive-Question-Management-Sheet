package com.iqms.backend.dto;

public record GoogleClientConfigResponse(
    String clientId,
    boolean googleAuthEnabled,
    boolean googleAuthClientIdConfigured) {}
