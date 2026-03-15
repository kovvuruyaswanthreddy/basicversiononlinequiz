package com.example.OnlineAssessment.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.OnlineAssessment.entity.EventStudent;

@Repository
public interface EventStudentRepository extends JpaRepository<EventStudent, Long> {
    List<EventStudent> findByEventId(String eventId);
    boolean existsByEventIdAndStudentRollNumber(String eventId, String studentRollNumber);
    List<EventStudent> findByStudentRollNumber(String studentRollNumber);
}
