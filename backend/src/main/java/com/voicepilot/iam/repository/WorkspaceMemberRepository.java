package com.voicepilot.iam.repository;

import com.voicepilot.iam.model.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, Long> {

    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.user.id = :userId AND wm.workspace.id = :workspaceId")
    Optional<WorkspaceMember> findByUserIdAndWorkspaceId(@Param("userId") Long userId, @Param("workspaceId") Long workspaceId);

    @Query("SELECT wm FROM WorkspaceMember wm JOIN FETCH wm.workspace WHERE wm.user.id = :userId")
    List<WorkspaceMember> findAllByUserIdWithWorkspace(@Param("userId") Long userId);

    @Query("SELECT wm FROM WorkspaceMember wm WHERE wm.workspace.id = :workspaceId")
    List<WorkspaceMember> findAllByWorkspaceId(@Param("workspaceId") Long workspaceId);
}

