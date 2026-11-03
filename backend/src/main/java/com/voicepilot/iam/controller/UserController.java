package com.voicepilot.iam.controller;

import com.voicepilot.common.api.ApiResponse;
import com.voicepilot.iam.dto.ChangePasswordRequest;
import com.voicepilot.iam.dto.UpdateProfileRequest;
import com.voicepilot.iam.dto.UserProfileResponse;
import com.voicepilot.iam.security.WorkspacePrincipal;
import com.voicepilot.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller handling user profile updates and password modifications.
 */
@RestController
@RequestMapping("/users")
@Tag(name = "User Management", description = "User profile and password management")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update current user profile", description = "Updates display name and avatar URL for current authenticated user.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal WorkspacePrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {

        UserProfileResponse response = userService.updateProfile(principal.userId(), request);
        return ResponseEntity.ok(ApiResponse.ok(response, "Profile updated successfully"));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password", description = "Updates password requiring current password verification; revokes active refresh tokens.")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal WorkspacePrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {

        userService.changePassword(principal.userId(), request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password updated successfully"));
    }
}

