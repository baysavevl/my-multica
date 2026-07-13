package com.baysave.multica.gemini;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.function.Supplier;

@Component
public class GeminiApiKeyProvider implements Supplier<Optional<String>> {

    @Override
    public Optional<String> get() {
        return env("GEMINI_API_KEY").or(() -> env("GOOGLE_API_KEY"));
    }

    private Optional<String> env(String name) {
        return Optional.ofNullable(System.getenv(name))
                .map(String::trim)
                .filter(value -> !value.isBlank());
    }
}
