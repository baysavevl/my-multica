package com.baysave.multica.gemini;

public interface GeminiClient {

    String generate(String apiKey, String model, String prompt);
}
