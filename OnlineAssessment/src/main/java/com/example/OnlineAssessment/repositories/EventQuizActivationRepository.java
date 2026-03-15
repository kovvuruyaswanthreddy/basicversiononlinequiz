package com.example.OnlineAssessment.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.OnlineAssessment.entity.EventQuizActivation;

@Repository
public interface EventQuizActivationRepository extends JpaRepository<EventQuizActivation, Long> {
    Optional<EventQuizActivation> findByEventIdAndQuizId(String eventId, String quizId);
    List<EventQuizActivation> findByEventId(String eventId);
    List<EventQuizActivation> findByEventIdAndActiveTrue(String eventId);
}
