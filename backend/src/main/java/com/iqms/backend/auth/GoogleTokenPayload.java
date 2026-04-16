package com.iqms.backend.auth;

public record GoogleTokenPayload(String email, boolean emailVerified, String name, String subject) {
}
