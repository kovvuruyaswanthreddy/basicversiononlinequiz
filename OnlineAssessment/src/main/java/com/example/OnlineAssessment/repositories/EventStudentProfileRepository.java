package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.OnlineAssessment.entity.EventStudentProfile;

@Repository
public interface EventStudentProfileRepository extends JpaRepository<EventStudentProfile, String> {
}
