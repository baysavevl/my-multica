package com.baysave.multica.gemini;

public record GeminiAskRequest(
        String topicId,
        String mode,
        String question,
        String answer
) {
}
