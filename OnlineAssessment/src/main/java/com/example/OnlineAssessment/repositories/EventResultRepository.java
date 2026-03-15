package com.example.OnlineAssessment.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.OnlineAssessment.entity.EventResult;

@Repository
public interface EventResultRepository extends JpaRepository<EventResult, Long> {
    List<EventResult> findByEventIdAndQuizId(String eventId, String quizId);
    List<EventResult> findByEventIdAndQuizIdOrderByScoreDescSubmissionTimeAsc(String eventId, String quizId);
    boolean existsByEventIdAndQuizIdAndStudentRollNumber(String eventId, String quizId, String studentRollNumber);
    List<EventResult> findByEventIdAndStudentRollNumber(String eventId, String studentRollNumber);
    List<EventResult> findByStudentRollNumber(String studentRollNumber);
}
