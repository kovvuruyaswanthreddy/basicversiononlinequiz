package com.example.OnlineAssessment.repositories;

import com.example.OnlineAssessment.entity.EventQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EventQuestionRepository extends JpaRepository<EventQuestion, String> {
    List<EventQuestion> findByEventIdAndQuizId(String eventId, String quizId);
    void deleteByEventIdAndQuizId(String eventId, String quizId);
}
