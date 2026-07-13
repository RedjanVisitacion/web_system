# Firebase setup

The web app is connected to Firebase project `attendance-system-57aa9`.

## 1. Enable Authentication

In Firebase Console, open **Authentication** → **Get started** → **Sign-in method** and enable **Email/Password**.

The login screen uses a **student ID** (10 digits, for example `2023304637`), not a regular email address. Firebase still uses Email/Password behind the scenes with a synthetic address:

```text
{studentId}@students.attendance-system-57aa9.local
```

Example: student ID `2023304637` → auth email `2023304637@students.attendance-system-57aa9.local`

Create the first administrator under **Authentication** → **Users** → **Add user**:

| Field | Example |
| --- | --- |
| Email | `2023304637@students.attendance-system-57aa9.local` |
| Password | Choose a secure password |

Record that user's UID.

## 2. Create Firestore

Open **Databases & Storage** → **Firestore Database** → **Create database**. Choose the location nearest to the school and select **Production mode**.

## 3. Add the administrator profile

In Firestore, create collection `users`. Create a document whose document ID is exactly the Firebase Authentication UID of the administrator. Add these fields:

```text
studentNo: "2023304637"
fullName: "School Administrator"
email: "2023304637@students.attendance-system-57aa9.local"
role: "admin"
active: true
```

## 4. Publish Firestore rules

Open **Firestore Database** → **Rules**, replace the temporary rules with the following, and publish them:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    match /users/{userId} {
      allow read: if signedIn() && (request.auth.uid == userId || isAdmin());
      allow create: if false;
      allow update: if signedIn() && request.auth.uid == userId
        && request.resource.data.role == resource.data.role;
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if isAdmin();
    }
  }
}
```

These rules intentionally prevent students from writing attendance records directly. Later, attendance check-in will use a carefully designed student-specific rule or a trusted server-side function.

## 5. Automatic database bootstrap

On the first successful **administrator** sign-in, the web app automatically creates default Firestore documents if they do not exist yet:

| Path | Purpose |
| --- | --- |
| `schoolSettings/attendance` | School name, late grace period, location policy, and academic year defaults |
| `_system/db` | Bootstrap metadata (version, initialized timestamp, planned collection list) |

Firestore creates a collection when its first document is saved. The app does **not** create empty placeholder collections for `courses`, `enrollments`, `attendanceSessions`, or `attendance` — those are created when you add real records through future features.

You only need to create the administrator Auth user and `users/{uid}` profile manually. Everything else in the table above is handled on first login.

## Planned Firestore data model

| Collection | Document ID | Purpose |
| --- | --- | --- |
| `users` | Firebase Authentication UID | Student and administrator profiles. Fields include `studentNo`, `fullName`, `email`, `course`, `yearLevel`, `role`, `active`, and `createdAt`. The `role` is either `admin` or `student`. |
| `courses` | Generated ID | Course/section records, for example `code`, `name`, `section`, `instructorId`, and `active`. |
| `enrollments` | Generated ID | Links a student to a course: `studentId`, `courseId`, `academicYear`, and `active`. |
| `attendanceSessions` | Generated ID | An attendance window opened by an administrator: `courseId`, `opensAt`, `closesAt`, `status`, and an optional short-lived QR-token hash. |
| `attendance` | `<sessionId>_<studentUid>` | The one attendance record for a student in a session: `sessionId`, `studentId`, `timeIn`, `timeOut`, `status`, `deviceId`, and limited audit metadata. Using this ID prevents duplicate check-ins for the same session. |
| `schoolSettings` | `attendance` | School-wide configuration such as the display name and attendance policy. Auto-created on first admin login. |
| `_system` | `db` | Bootstrap metadata. Auto-created on first admin login. |

## Local testing

Do not open `index.html` by double-clicking it. Serve this folder using a local web server, for example VS Code's Live Server extension, then open the localhost URL it provides.

Sign in with your **10-digit student ID** and password — not a regular email address.
