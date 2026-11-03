package com.voicepilot.iam.service;

import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.iam.dto.ChangePasswordRequest;
import com.voicepilot.iam.dto.UpdateProfileRequest;
import com.voicepilot.iam.dto.UserProfileResponse;
import com.voicepilot.iam.model.User;
import com.voicepilot.iam.model.WorkspaceMember;
import com.voicepilot.iam.repository.RefreshTokenRepository;
import com.voicepilot.iam.repository.UserRepository;
import com.voicepilot.iam.repository.WorkspaceMemberRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing user profile updates and password change workflows.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public UserService(UserRepository userRepository,
                       WorkspaceMemberRepository workspaceMemberRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       AuthService authService) {
        this.userRepository = userRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    /**
     * Updates display name and avatar URL for the user.
     */
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        user.setDisplayName(request.displayName().trim());
        user.setAvatarUrl(request.avatarUrl() != null && !request.avatarUrl().isBlank() ? request.avatarUrl().trim() : null);
        user = userRepository.save(user);

        return authService.getCurrentUserProfile(userId);
    }

    /**
     * Changes password, requiring verification of current password and revoking active refresh tokens.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password provided does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Security best practice: revoke all active refresh tokens upon password change
        List<WorkspaceMember> memberships = workspaceMemberRepository.findAllByUserIdWithWorkspace(userId);
        for (WorkspaceMember m : memberships) {
            refreshTokenRepository.revokeAllByUserIdAndWorkspaceId(userId, m.getWorkspace().getId());
        }
    }
}

