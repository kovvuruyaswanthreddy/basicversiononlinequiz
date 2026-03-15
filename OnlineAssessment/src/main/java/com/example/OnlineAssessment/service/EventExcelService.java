package com.example.OnlineAssessment.service;

import java.io.InputStream;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.OnlineAssessment.entity.EventStudent;
import com.example.OnlineAssessment.entity.EventStudentProfile;
import com.example.OnlineAssessment.repositories.EventStudentRepository;
import com.example.OnlineAssessment.repositories.EventRepository;
import com.example.OnlineAssessment.repositories.EventStudentProfileRepository;

@Service
public class EventExcelService {

    @Autowired
    private EventStudentRepository eventStudentRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventStudentProfileRepository eventStudentProfileRepository;

    public void uploadEventStudents(MultipartFile file, String defaultEventId, String facultyEmail) throws Exception {
        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // Expected format: RollNo, Name, Dept, Year, Section, Email, EventId, EventName
                String rollNo = formatter.formatCellValue(row.getCell(0)).trim();
                if (rollNo.isEmpty()) continue;

                String name = formatter.formatCellValue(row.getCell(1)).trim();
                String dept = formatter.formatCellValue(row.getCell(2)).trim();
                String yearStr = formatter.formatCellValue(row.getCell(3)).trim();
                String section = formatter.formatCellValue(row.getCell(4)).trim();
                String email = formatter.formatCellValue(row.getCell(5)).trim();
                
                String rowEventId = formatter.formatCellValue(row.getCell(6)).trim();
                String rowEventName = formatter.formatCellValue(row.getCell(7)).trim();

                String finalEventId = !rowEventId.isEmpty() ? rowEventId : defaultEventId;
                if (finalEventId == null || finalEventId.isEmpty()) continue;

                int year = 0;
                try {
                    if (!yearStr.isEmpty()) year = Integer.parseInt(yearStr);
                } catch (NumberFormatException e) {}

                // 1. Ensure EventStudentProfile exists
                EventStudentProfile profile = eventStudentProfileRepository.findById(rollNo).orElse(null);
                if (profile == null) {
                    profile = new EventStudentProfile();
                    profile.setRollNumber(rollNo);
                    profile.setName(name.isEmpty() ? rollNo : name);
                    profile.setDepartment(dept);
                    profile.setYear(year);
                    profile.setSection(section);
                    profile.setEmail(email);
                    profile.setPassword("Reset@2025");
                    eventStudentProfileRepository.save(profile);
                }

                // 2. Ensure Event exists
                if (!eventRepository.existsById(finalEventId)) {
                    com.example.OnlineAssessment.entity.Event newEvent = new com.example.OnlineAssessment.entity.Event();
                    newEvent.setEventId(finalEventId);
                    newEvent.setEventName(rowEventName.isEmpty() ? finalEventId : rowEventName);
                    newEvent.setFacultyEmail(facultyEmail);
                    eventRepository.save(newEvent);
                }

                // 3. Map to Event
                if (!eventStudentRepository.existsByEventIdAndStudentRollNumber(finalEventId, rollNo)) {
                    EventStudent es = new EventStudent();
                    es.setEventId(finalEventId);
                    es.setStudentRollNumber(rollNo);
                    eventStudentRepository.save(es);
                }
            }
        }
    }
}
