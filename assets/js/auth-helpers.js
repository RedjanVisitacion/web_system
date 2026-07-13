const STUDENT_ID_PATTERN = /^\d{10}$/;

export function isValidStudentId(studentId) {
  return STUDENT_ID_PATTERN.test(studentId);
}
