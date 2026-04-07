package com.iqms.backend.queue;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ActionQueueService {

  private final ExecutorService actionExecutor = Executors.newSingleThreadExecutor();
  private final long processingDelayMillis;

  public ActionQueueService(@Value("${app.queue.processing-delay-ms:250}") long processingDelayMillis) {
    this.processingDelayMillis = Math.max(processingDelayMillis, 0);
  }

  public <T> T execute(Callable<T> action) {
    Future<T> future = actionExecutor.submit(() -> {
      throttle();
      return action.call();
    });

    try {
      return future.get();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Action queue was interrupted.", e);
    } catch (ExecutionException e) {
      Throwable cause = e.getCause();
      if (cause instanceof RuntimeException runtimeException) {
        throw runtimeException;
      }
      throw new IllegalStateException("Failed to process queued action.", cause);
    }
  }

  @PreDestroy
  public void shutdown() {
    actionExecutor.shutdown();
  }

  private void throttle() {
    if (processingDelayMillis <= 0) {
      return;
    }
    try {
      TimeUnit.MILLISECONDS.sleep(processingDelayMillis);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IllegalStateException("Action queue was interrupted.", e);
    }
  }
}
