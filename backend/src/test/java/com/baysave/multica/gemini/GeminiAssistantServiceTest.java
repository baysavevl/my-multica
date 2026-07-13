package com.baysave.multica.gemini;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class GeminiAssistantServiceTest {

    @Test
    void returnsDisabledResponseWhenApiKeyIsMissing() {
        RecordingGeminiClient client = new RecordingGeminiClient();
        GeminiAssistantService service = new GeminiAssistantService(
                client,
                new GeminiUsageLimiter(20),
                () -> Optional.empty()
        );

        GeminiAskResponse response = service.ask(new GeminiAskRequest(
                "runtime",
                "explain",
                "What is a runtime?",
                ""
        ));

        assertThat(response.ok()).isFalse();
        assertThat(response.disabled()).isTrue();
        assertThat(response.model()).isEqualTo(GeminiAssistantService.FLASH_MODEL);
        assertThat(response.message()).isEqualTo("Gemini API key is not configured");
        assertThat(client.calls).isEmpty();
    }

    @Test
    void callsGeminiWithFlashOnlyModelAndTopicPrompt() {
        RecordingGeminiClient client = new RecordingGeminiClient();
        GeminiAssistantService service = new GeminiAssistantService(
                client,
                new GeminiUsageLimiter(20),
                () -> Optional.of("test-key")
        );

        GeminiAskResponse response = service.ask(new GeminiAskRequest(
                "agent",
                "review",
                "Review my answer",
                "An agent is a runtime."
        ));

        assertThat(response.ok()).isTrue();
        assertThat(response.disabled()).isFalse();
        assertThat(response.model()).isEqualTo("gemini-2.5-flash");
        assertThat(response.text()).isEqualTo("Flash response");
        assertThat(client.calls).hasSize(1);
        assertThat(client.calls.getFirst().apiKey()).isEqualTo("test-key");
        assertThat(client.calls.getFirst().model()).isEqualTo("gemini-2.5-flash");
        assertThat(client.calls.getFirst().prompt())
                .contains("topic: agent")
                .contains("mode: review")
                .contains("Review my answer")
                .contains("An agent is a runtime.")
                .doesNotContain("gemini-2.5-pro");
    }

    @Test
    void blocksRequestsAfterLimitIsReached() {
        RecordingGeminiClient client = new RecordingGeminiClient();
        GeminiAssistantService service = new GeminiAssistantService(
                client,
                new GeminiUsageLimiter(1),
                () -> Optional.of("test-key")
        );

        GeminiAskResponse first = service.ask(new GeminiAskRequest("runtime", "explain", "First", ""));
        GeminiAskResponse second = service.ask(new GeminiAskRequest("runtime", "explain", "Second", ""));

        assertThat(first.ok()).isTrue();
        assertThat(second.ok()).isFalse();
        assertThat(second.message()).isEqualTo("Gemini Flash request limit reached for this backend process");
        assertThat(client.calls).hasSize(1);
    }

    private static class RecordingGeminiClient implements GeminiClient {
        private final List<Call> calls = new ArrayList<>();

        @Override
        public String generate(String apiKey, String model, String prompt) {
            calls.add(new Call(apiKey, model, prompt));
            return "Flash response";
        }
    }

    private record Call(String apiKey, String model, String prompt) {
    }
}
