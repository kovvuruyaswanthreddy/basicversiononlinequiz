package com.example.OnlineAssessment.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Event {

    @Id
    private String eventId;
    private String eventName;
    private String facultyEmail; // The faculty who created it

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventName() { return eventName; }
    public void setEventName(String eventName) { this.eventName = eventName; }

    public String getFacultyEmail() { return facultyEmail; }
    public void setFacultyEmail(String facultyEmail) { this.facultyEmail = facultyEmail; }
}
