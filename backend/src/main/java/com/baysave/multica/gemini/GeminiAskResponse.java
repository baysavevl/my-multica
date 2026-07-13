package com.baysave.multica.gemini;

public record GeminiAskResponse(
        boolean ok,
        boolean disabled,
        String model,
        String mode,
        String message,
        String text,
        int remaining
) {
}
