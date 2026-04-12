package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.iqms.backend.model.Sheet;
import com.iqms.backend.queue.ActionQueueService;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SheetServiceTest {

  @Mock private SheetRepository sheetRepository;
  @Mock private UserRepository userRepository;
  @Mock private ActionQueueService actionQueueService;
  @Mock private PremiumAccessService premiumAccessService;
  @Mock private SheetCollaborationService collaborationService;

  @InjectMocks private SheetService sheetService;

  @BeforeEach
  void setUp() {
    when(actionQueueService.execute(any())).thenAnswer(invocation -> {
      @SuppressWarnings("unchecked")
      java.util.concurrent.Callable<Object> callable = invocation.getArgument(0);
      return callable.call();
    });
  }

  @Test
  void createSheetUsesDefaultTitleWhenBlank() {
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(collaborationService.canView(any(), any())).thenReturn(true);
    when(collaborationService.canEdit(any(), any())).thenReturn(true);

    Sheet created = sheetService.createSheet("owner-1", "   ");

    assertThat(created.getTitle()).isEqualTo("Untitled Sheet");
    assertThat(created.getOwnerId()).isEqualTo("owner-1");
    assertThat(created.getCreatedAt()).isBeforeOrEqualTo(Instant.now());
  }

  @Test
  void updateOwnedSheetUpdatesMutableFields() {
    Sheet sheet = new Sheet();
    sheet.setId("sheet-1");
    sheet.setOwnerId("owner-1");
    sheet.setTitle("Old");

    when(sheetRepository.findById("sheet-1")).thenReturn(Optional.of(sheet));
    com.iqms.backend.model.User owner = new com.iqms.backend.model.User();
    owner.setId("owner-1");
    when(premiumAccessService.findUser("owner-1")).thenReturn(owner);
    when(sheetRepository.save(any(Sheet.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(collaborationService.canView(any(), any())).thenReturn(true);
    when(collaborationService.canEdit(any(), any())).thenReturn(true);

    Sheet updated = sheetService.updateOwnedSheet(
        "owner-1",
        "sheet-1",
        "New Title",
        List.of(Map.of("id", "t1")),
        true,
        false);

    assertThat(updated.getTitle()).isEqualTo("New Title");
    assertThat(updated.isPublic()).isTrue();
    assertThat(updated.isArchived()).isFalse();
    assertThat(updated.getTopics()).hasSize(1);
  }

  @Test
  void getOwnedSheetThrowsNotFoundWhenMissing() {
    when(sheetRepository.findByIdAndOwnerId("sheet-404", "owner-1")).thenReturn(Optional.empty());

    ResponseStatusException ex = assertThrows(
        ResponseStatusException.class,
        () -> sheetService.getOwnedSheet("owner-1", "sheet-404"));

    assertThat(ex.getStatusCode().value()).isEqualTo(HttpStatus.NOT_FOUND.value());
  }

  @Test
  void deleteOwnedSheetDeletesFoundSheet() {
    Sheet sheet = new Sheet();
    sheet.setId("sheet-1");
    sheet.setOwnerId("owner-1");
    when(sheetRepository.findById("sheet-1")).thenReturn(Optional.of(sheet));
    com.iqms.backend.model.User owner = new com.iqms.backend.model.User();
    owner.setId("owner-1");
    when(premiumAccessService.findUser("owner-1")).thenReturn(owner);

    sheetService.deleteOwnedSheet("owner-1", "sheet-1");

    verify(sheetRepository).delete(sheet);
  }
}
