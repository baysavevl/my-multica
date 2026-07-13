package com.baysave.multica.gemini;

import com.baysave.multica.bridge.MulticaCommandExecutor;
import com.baysave.multica.bridge.MulticaCommandKind;
import com.baysave.multica.bridge.MulticaCommandResult;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class GeminiSetupService {

    static final String INSTALL_COMMAND = "npm install -g @google/gemini-cli";
    static final String FLASH_COMMAND = "gemini -m gemini-2.5-flash";

    private final MulticaCommandExecutor executor;

    public GeminiSetupService(MulticaCommandExecutor executor) {
        this.executor = executor;
    }

    public GeminiSetupStatus status() {
        Optional<String> geminiPath = findExecutable("gemini");
        GeminiSetupStatus.GeminiCliStatus cliStatus = new GeminiSetupStatus.GeminiCliStatus(
                geminiPath.isPresent(),
                geminiPath.orElse(""),
                INSTALL_COMMAND,
                FLASH_COMMAND
        );
        GeminiSetupStatus.MulticaProfileStatus profileStatus = profileStatus();
        return new GeminiSetupStatus(
                true,
                cliStatus,
                profileStatus,
                steps(geminiPath.isPresent(), profileStatus.ok()),
                "Gemini Flash setup can be completed locally"
        );
    }

    private GeminiSetupStatus.MulticaProfileStatus profileStatus() {
        List<String> command = List.of("multica", "runtime", "profile", "list", "--output", "json");
        try {
            MulticaCommandResult result = executor.run(MulticaCommandKind.RUNTIME_PROFILE_LIST, command, true);
            return new GeminiSetupStatus.MulticaProfileStatus(
                    result.ok(),
                    result.message(),
                    result.stdout(),
                    String.join(" ", command)
            );
        } catch (RuntimeException exception) {
            MulticaCommandResult result = MulticaCommandResult.failure(
                    MulticaCommandKind.RUNTIME_PROFILE_LIST,
                    command,
                    null,
                    "",
                    exception.getMessage(),
                    Duration.ZERO,
                    "profile list unavailable"
            );
            return new GeminiSetupStatus.MulticaProfileStatus(
                    false,
                    result.message(),
                    result.stderr(),
                    String.join(" ", command)
            );
        }
    }

    private List<String> steps(boolean geminiInstalled, boolean profileReadable) {
        List<String> steps = new ArrayList<>();
        if (!geminiInstalled) {
            steps.add("Install Gemini CLI: " + INSTALL_COMMAND);
        }
        steps.add("Set GEMINI_API_KEY or GOOGLE_API_KEY before starting the local bridge");
        steps.add("Use Flash only: " + FLASH_COMMAND);
        if (!profileReadable) {
            steps.add("Check Multica runtime profile support with: multica runtime profile list --output json");
        }
        steps.add("Create a Multica agent using your Gemini runtime profile after your Multica install exposes the correct protocol family");
        return steps;
    }

    private Optional<String> findExecutable(String name) {
        String pathValue = System.getenv("PATH");
        if (pathValue == null || pathValue.isBlank()) {
            return Optional.empty();
        }
        String executableName = isWindows() ? name + ".cmd" : name;
        for (String folder : pathValue.split(File.pathSeparator)) {
            if (folder == null || folder.isBlank()) {
                continue;
            }
            Path executable = Path.of(folder, executableName);
            if (Files.isRegularFile(executable) && Files.isExecutable(executable)) {
                return Optional.of(executable.toString());
            }
        }
        return Optional.empty();
    }

    private boolean isWindows() {
        return System.getProperty("os.name", "").toLowerCase().contains("win");
    }
}
