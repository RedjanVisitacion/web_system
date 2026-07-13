# Firebase setup

The web app is connected to Firebase project `attendance-system-57aa9`.

Login uses **Firestore only**: the student ID and password entered on the login page are compared directly with fields stored in the database. Firebase Authentication is **not** used for sign-in.

## 1. Create Firestore

Open **Databases & Storage** → **Firestore Database** → **Create database**. Choose the location nearest to the school and select **Production mode**.

## 2. Add a user account in Firestore

Create collection `users`. You can use either layout below.

### Recommended: document ID = student ID

| Setting | Value |
| --- | --- |
| Collection | `users` |
| Document ID | `2023304637` |
| Fields | see below |

```text
studentNo: "2023304637"
password: "Redjan09"
fullName: "Redjan Phil S. Visitacion"
role: "admin"
active: true
```

### Also supported: any document ID with studentNo field

If you already created a document with an auto-generated ID, just make sure it includes at least:

```text
studentNo: "2023304637"
password: "Redjan09"
fullName: "Redjan Phil S. Visitacion"
role: "admin"
active: true
```

Set `role` to `admin` for administrators or `student` for students. Set `active` to `false` to block sign-in.

## 3. Publish Firestore rules

Open **Firestore Database** → **Rules**, replace the rules with the following, and publish them:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isStudentId(id) {
      return id.matches('^\\d{10}$');
    }

    match /users/{userId} {
      allow get: if isStudentId(userId)
        && resource.data.password is string;
      allow list: if resource.data.studentNo is string
        && resource.data.studentNo.matches('^\\d{10}$')
        && resource.data.password is string;
      allow create, update, delete: if false;
    }

    match /schoolSettings/{document} {
      allow read: if true;
      allow create: if !exists(/databases/$(database)/documents/schoolSettings/$(document));
      allow update, delete: if false;
    }

    match /_system/{document} {
      allow read: if true;
      allow create: if !exists(/databases/$(database)/documents/_system/$(document));
      allow update, delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

These rules allow the login page to read one user record for sign-in, but prevent visitors from creating or editing user accounts from the browser.

## 4. Automatic database bootstrap

When an **administrator** signs in, the web app automatically creates default Firestore documents if they do not exist yet:

| Path | Purpose |
| --- | --- |
| `schoolSettings/attendance` | School name, late grace period, location policy, and academic year defaults |
| `_system/db` | Bootstrap metadata (version, initialized timestamp, planned collection list) |

## Planned Firestore data model

| Collection | Document ID | Purpose |
| --- | --- | --- |
| `users` | Student ID (recommended) or generated ID | Login account. Required fields: `studentNo`, `password`, `fullName`, `role`, `active`. |
| `courses` | Generated ID | Course/section records, for example `code`, `name`, `section`, `instructorId`, and `active`. |
| `enrollments` | Generated ID | Links a student to a course: `studentId`, `courseId`, `academicYear`, and `active`. |
| `attendanceSessions` | Generated ID | An attendance window opened by an administrator: `courseId`, `opensAt`, `closesAt`, `status`, and an optional short-lived QR-token hash. |
| `attendance` | `<sessionId>_<studentUid>` | The one attendance record for a student in a session: `sessionId`, `studentId`, `timeIn`, `timeOut`, `status`, `deviceId`, and limited audit metadata. |
| `schoolSettings` | `attendance` | School-wide configuration. Auto-created on first admin login. |
| `_system` | `db` | Bootstrap metadata. Auto-created on first admin login. |

## Security note

Passwords are checked directly against Firestore for this first version. That is acceptable for early development, but before production you should move password hashing and login verification to a trusted backend so plain passwords are not readable from the database.

## Local testing

Do not open `index.html` by double-clicking it. Serve this folder using a local web server, for example VS Code's Live Server extension, then open the localhost URL it provides.

Sign in with your **10-digit student ID** and the **password stored in Firestore**.

## Troubleshooting sign-in

If you see **"The student ID or password is incorrect"**, check these in order:

1. Firestore document exists in `users` with matching `studentNo` (or document ID equals the student ID).
2. `password` field in Firestore exactly matches what you type on the login page.
3. `active` is not set to `false`.
4. Firestore rules from section 3 are published.

If you see **"Could not reach the database"**, check your internet connection and confirm Firestore is enabled for the project.
