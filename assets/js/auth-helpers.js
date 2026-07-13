const AUTH_EMAIL_DOMAIN = "students.attendance-system-57aa9.local";
const STUDENT_ID_PATTERN = /^\d{10}$/;

export function isValidStudentId(studentId) {
  return STUDENT_ID_PATTERN.test(studentId);
}

export function studentIdToAuthEmail(studentId) {
  return `${studentId}@${AUTH_EMAIL_DOMAIN}`;
}

export function authEmailToStudentId(email) {
  if (!email || !email.endsWith(`@${AUTH_EMAIL_DOMAIN}`)) {
    return null;
  }
  const studentId = email.split("@")[0];
  return isValidStudentId(studentId) ? studentId : null;
}
