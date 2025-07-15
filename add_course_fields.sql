-- Add new fields to courses table for course editing functionality
ALTER TABLE courses 
ADD COLUMN school VARCHAR(255),
ADD COLUMN instructor VARCHAR(255),
ADD COLUMN instructor_email VARCHAR(255);