package com.baysave.multica.gemini;

import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.Set;
import java.util.function.Supplier;

@Service
public class GeminiAssistantService {

    public static final String FLASH_MODEL = "gemini-2.5-flash";

    private static final int MAX_TEXT_LENGTH = 4_000;
    private static final Set<String> MODES = Set.of("explain", "review", "next_practice");

    private final GeminiClient client;
    private final GeminiUsageLimiter limiter;
    private final Supplier<Optional<String>> apiKeySupplier;

    public GeminiAssistantService(
            GeminiClient client,
            GeminiUsageLimiter limiter,
            Supplier<Optional<String>> apiKeySupplier
    ) {
        this.client = client;
        this.limiter = limiter;
        this.apiKeySupplier = apiKeySupplier;
    }

    public GeminiAskResponse ask(GeminiAskRequest request) {
        GeminiAskRequest input = normalize(request);
        Optional<String> apiKey = apiKeySupplier.get();
        if (apiKey.isEmpty()) {
            return response(false, true, input.mode(), "Gemini API key is not configured", "");
        }
        if (!limiter.tryAcquire()) {
            return response(false, false, input.mode(), "Gemini Flash request limit reached for this backend process", "");
        }

        try {
            String text = client.generate(apiKey.get(), FLASH_MODEL, prompt(input));
            return response(true, false, input.mode(), "OK", text == null ? "" : text.trim());
        } catch (RuntimeException exception) {
            return response(false, false, input.mode(), "Gemini Flash request failed", "");
        }
    }

    private GeminiAskRequest normalize(GeminiAskRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Gemini request is required");
        }
        String topicId = trim(request.topicId());
        String mode = trim(request.mode());
        String question = trim(request.question());
        String answer = trim(request.answer());
        if (topicId.isBlank()) {
            throw new IllegalArgumentException("topic id is required");
        }
        if (!MODES.contains(mode)) {
            throw new IllegalArgumentException("Gemini mode is invalid");
        }
        if (question.length() > MAX_TEXT_LENGTH || answer.length() > MAX_TEXT_LENGTH) {
            throw new IllegalArgumentException("Gemini request text is too long");
        }
        return new GeminiAskRequest(topicId, mode, question, answer);
    }

    private String prompt(GeminiAskRequest request) {
        return """
                You are helping me learn Multica in my personal training project.
                Use short, practical explanations. Keep the answer specific to Multica.
                The only Gemini model allowed by this app is Flash.

                topic: %s
                mode: %s

                My question:
                %s

                My practice answer:
                %s

                Return:
                - the key idea
                - one concrete demo or correction
                - the next practice step
                """.formatted(request.topicId(), request.mode(), request.question(), request.answer());
    }

    private GeminiAskResponse response(boolean ok, boolean disabled, String mode, String message, String text) {
        return new GeminiAskResponse(ok, disabled, FLASH_MODEL, mode, message, text, limiter.remaining());
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
