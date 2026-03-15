package com.example.OnlineAssessment.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Stores credentials for EVENT-only students.
 * Completely separate from the academic Student table.
 */
@Entity
@Table(name = "event_student_profile")
public class EventStudentProfile {

    @Id
    private String rollNumber;

    private String name;
    private String password;
    private String email;
    private String department;
    private int year;
    private String section;

    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
}
