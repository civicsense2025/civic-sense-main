export enum UserRole {
  Admin = 'admin',
  Parent = 'parent',
  Teacher = 'teacher',
  Organizer = 'organizer',
  Child = 'child',
  Student = 'student',
  Member = 'member'
}

export type UserRoleValue = `${UserRole}` 