package com.iqms.backend.model;

import java.time.Instant;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "push_subscriptions")
@CompoundIndexes({
    @CompoundIndex(name = "user_endpoint_unique", def = "{'userId': 1, 'endpoint': 1}", unique = true)
})
public class PushSubscription {
  @Id
  private String id;

  @Indexed
  private String userId;
  private String endpoint;
  private Map<String, String> keys;
  private Instant createdAt;
  private Instant updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getUserId() { return userId; }
  public void setUserId(String userId) { this.userId = userId; }
  public String getEndpoint() { return endpoint; }
  public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
  public Map<String, String> getKeys() { return keys; }
  public void setKeys(Map<String, String> keys) { this.keys = keys; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
