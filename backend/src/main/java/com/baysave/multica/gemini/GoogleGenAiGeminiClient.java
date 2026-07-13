package com.baysave.multica.gemini;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.stereotype.Component;

@Component
public class GoogleGenAiGeminiClient implements GeminiClient {

    @Override
    public String generate(String apiKey, String model, String prompt) {
        try (Client client = Client.builder()
                .apiKey(apiKey)
                .build()) {
            GenerateContentResponse response = client.models.generateContent(model, prompt, null);
            String text = response.text();
            return text == null ? "" : text;
        }
    }
}
