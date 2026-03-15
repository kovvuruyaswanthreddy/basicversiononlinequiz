package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.EventQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EventQuizRepository extends JpaRepository<EventQuiz, Long> {
    Optional<EventQuiz> findByEventIdAndQuizId(String eventId, String quizId);
    List<EventQuiz> findByEventIdAndActiveTrue(String eventId);
    boolean existsByEventIdAndQuizId(String eventId, String quizId);
}
