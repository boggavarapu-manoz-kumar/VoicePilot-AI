package com.voicepilot.common.exception;

/**
 * Exception thrown when a state conflict or duplicate violation occurs.
 */
public class ResourceConflictException extends RuntimeException {

    public ResourceConflictException(String message) {
        super(message);
    }

    public ResourceConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}

