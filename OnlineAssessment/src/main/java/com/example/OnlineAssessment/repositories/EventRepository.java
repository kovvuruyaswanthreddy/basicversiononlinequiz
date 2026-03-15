package com.example.OnlineAssessment.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.OnlineAssessment.entity.Event;

@Repository
public interface EventRepository extends JpaRepository<Event, String> {
}
