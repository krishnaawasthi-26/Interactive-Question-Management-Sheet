package com.iqms.backend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.iqms.backend.model.Sheet;
import com.iqms.backend.model.User;
import com.iqms.backend.repository.SheetActivityEventRepository;
import com.iqms.backend.repository.SheetCommentRepository;
import com.iqms.backend.repository.SheetRepository;
import com.iqms.backend.repository.UserRepository;
import java.util.ArrayList;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class SheetCollaborationServiceTest {

  @Mock private SheetRepository sheetRepository;
  @Mock private UserRepository userRepository;
  @Mock private SheetCommentRepository commentRepository;
  @Mock private SheetActivityEventRepository activityEventRepository;

  @InjectMocks private SheetCollaborationService service;

  @Test
  void inviteRequiresOwnerRole() {
    Sheet sheet = new Sheet();
    sheet.setId("s1");
    sheet.setOwnerId("owner");
    sheet.setCollaborators(new ArrayList<>());
    when(sheetRepository.findById("s1")).thenReturn(Optional.of(sheet));

    assertThrows(ResponseStatusException.class, () -> service.invite("other", "s1", "alice", "editor"));
  }

  @Test
  void inviteAddsCollaborator() {
    Sheet sheet = new Sheet();
    sheet.setId("s1");
    sheet.setOwnerId("owner");
    sheet.setCollaborators(new ArrayList<>());
    when(sheetRepository.findById("s1")).thenReturn(Optional.of(sheet));
    User target = new User();
    target.setId("u2");
    when(userRepository.findByUsername("alice")).thenReturn(Optional.of(target));
    when(sheetRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    Sheet updated = service.invite("owner", "s1", "alice", "editor");

    assertThat(updated.getCollaborators()).hasSize(1);
    assertThat(updated.getCollaborators().get(0).getRole()).isEqualTo("editor");
  }
}
