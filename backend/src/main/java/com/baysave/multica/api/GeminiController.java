package com.baysave.multica.api;

import com.baysave.multica.gemini.GeminiAskRequest;
import com.baysave.multica.gemini.GeminiAskResponse;
import com.baysave.multica.gemini.GeminiAssistantService;
import com.baysave.multica.gemini.GeminiSetupService;
import com.baysave.multica.gemini.GeminiSetupStatus;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
public class GeminiController {

    private final GeminiAssistantService assistantService;
    private final GeminiSetupService setupService;

    public GeminiController(GeminiAssistantService assistantService, GeminiSetupService setupService) {
        this.assistantService = assistantService;
        this.setupService = setupService;
    }

    @PostMapping("/ask")
    public GeminiAskResponse ask(@RequestBody GeminiAskRequest request) {
        return assistantService.ask(request);
    }

    @GetMapping("/setup")
    public GeminiSetupStatus setup() {
        return setupService.status();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> invalidRequest(IllegalArgumentException exception) {
        return Map.of(
                "ok", false,
                "message", exception.getMessage()
        );
    }
}
