package com.iqms.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iqms.backend.exception.GlobalExceptionHandler;
import com.iqms.backend.model.Sheet;
import com.iqms.backend.security.CurrentUser;
import com.iqms.backend.service.SheetService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(SheetController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class SheetControllerTest {

  @Autowired private MockMvc mockMvc;
  @Autowired private ObjectMapper objectMapper;

  @MockitoBean private SheetService sheetService;
  @MockitoBean private CurrentUser currentUser;

  @Test
  void createSheetReturnsCreatedSheet() throws Exception {
    Sheet sheet = new Sheet();
    sheet.setId("s1");
    sheet.setTitle("My Sheet");
    sheet.setPublic(true);
    sheet.setArchived(false);

    when(currentUser.getUserId(any())).thenReturn("owner-1");
    when(sheetService.createSheet(eq("owner-1"), eq("My Sheet"))).thenReturn(sheet);

    mockMvc.perform(post("/api/sheets")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(Map.of("title", "My Sheet"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("s1"))
        .andExpect(jsonPath("$.isPublic").value(true))
        .andExpect(jsonPath("$.isArchived").value(false));
  }

  @Test
  void createSheetValidationFailureReturnsBadRequest() throws Exception {
    String longTitle = "x".repeat(121);

    mockMvc.perform(post("/api/sheets")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(Map.of("title", longTitle))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.validationErrors.title").exists());
  }

  @Test
  void updateSheetPropagatesNotFoundAsStructuredError() throws Exception {
    when(currentUser.getUserId(any())).thenReturn("owner-1");
    when(sheetService.updateOwnedSheet(eq("owner-1"), eq("missing"), any(), any(), any(), any(), any()))
        .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Sheet not found."));

    mockMvc.perform(put("/api/sheets/missing")
            .contentType("application/json")
            .content(objectMapper.writeValueAsString(Map.of(
                "title", "Updated",
                "topics", List.of()))))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("Sheet not found."));
  }
}
