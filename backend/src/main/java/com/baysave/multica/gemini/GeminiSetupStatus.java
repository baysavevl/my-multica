package com.baysave.multica.gemini;

import java.util.List;

public record GeminiSetupStatus(
        boolean ok,
        GeminiCliStatus geminiCli,
        MulticaProfileStatus multicaProfile,
        List<String> steps,
        String message
) {

    public GeminiSetupStatus {
        steps = List.copyOf(steps);
    }

    public record GeminiCliStatus(
            boolean installed,
            String path,
            String installCommand,
            String flashCommand
    ) {
    }

    public record MulticaProfileStatus(
            boolean ok,
            String message,
            String output,
            String command
    ) {
    }
}
