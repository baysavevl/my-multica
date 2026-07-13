package com.baysave.multica.api;

import com.baysave.multica.gemini.GeminiAskRequest;
import com.baysave.multica.gemini.GeminiAskResponse;
import com.baysave.multica.gemini.GeminiAssistantService;
import com.baysave.multica.gemini.GeminiSetupService;
import com.baysave.multica.gemini.GeminiSetupStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(GeminiController.class)
class GeminiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GeminiAssistantService assistantService;

    @MockBean
    private GeminiSetupService setupService;

    @Test
    void rejectsGeminiRequestsWithoutControlHeader() throws Exception {
        mockMvc.perform(get("/api/gemini/setup"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.ok").value(false));
    }

    @Test
    void delegatesAskRequestsToFlashAssistant() throws Exception {
        when(assistantService.ask(new GeminiAskRequest(
                "agent",
                "review",
                "Check this",
                "Agent is a CLI worker"
        ))).thenReturn(new GeminiAskResponse(
                true,
                false,
                GeminiAssistantService.FLASH_MODEL,
                "review",
                "OK",
                "Tighten the runtime distinction.",
                19
        ));

        mockMvc.perform(post("/api/gemini/ask")
                        .with(localRequest())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "topicId": "agent",
                                  "mode": "review",
                                  "question": "Check this",
                                  "answer": "Agent is a CLI worker"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.model").value("gemini-2.5-flash"))
                .andExpect(jsonPath("$.text").value("Tighten the runtime distinction."));

        verify(assistantService).ask(new GeminiAskRequest(
                "agent",
                "review",
                "Check this",
                "Agent is a CLI worker"
        ));
    }

    @Test
    void returnsGeminiSetupStatus() throws Exception {
        when(setupService.status()).thenReturn(new GeminiSetupStatus(
                true,
                new GeminiSetupStatus.GeminiCliStatus(
                        false,
                        "",
                        "npm install -g @google/gemini-cli",
                        "gemini -m gemini-2.5-flash"
                ),
                new GeminiSetupStatus.MulticaProfileStatus(
                        false,
                        "profile list unavailable",
                        "",
                        "multica runtime profile list --output json"
                ),
                List.of("Install Gemini CLI", "Export GEMINI_API_KEY"),
                "Gemini Flash setup can be completed locally"
        ));

        mockMvc.perform(get("/api/gemini/setup").with(localRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.geminiCli.installed").value(false))
                .andExpect(jsonPath("$.geminiCli.flashCommand").value("gemini -m gemini-2.5-flash"))
                .andExpect(jsonPath("$.steps[0]").value("Install Gemini CLI"));
    }

    private RequestPostProcessor localRequest() {
        return request -> {
            request.setRemoteAddr("127.0.0.1");
            request.addHeader(MulticaLocalRequestGuard.HEADER_NAME, MulticaLocalRequestGuard.HEADER_VALUE);
            return request;
        };
    }
}
