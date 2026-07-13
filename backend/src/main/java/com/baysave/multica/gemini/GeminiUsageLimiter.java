package com.baysave.multica.gemini;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class GeminiUsageLimiter {

    private final int maxRequests;
    private LocalDate window = LocalDate.now();
    private int used;

    public GeminiUsageLimiter(@Value("${gemini.flash.max-requests:20}") int maxRequests) {
        this.maxRequests = Math.max(0, maxRequests);
    }

    public synchronized boolean tryAcquire() {
        refreshWindow();
        if (used >= maxRequests) {
            return false;
        }
        used += 1;
        return true;
    }

    public synchronized int remaining() {
        refreshWindow();
        return Math.max(0, maxRequests - used);
    }

    private void refreshWindow() {
        LocalDate today = LocalDate.now();
        if (!today.equals(window)) {
            window = today;
            used = 0;
        }
    }
}
