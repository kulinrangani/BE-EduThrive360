/**
 * UI copy variants for school vs corporate organizations.
 */
export function memberLabels(orgType) {
  if (orgType === "corporate") {
    return {
      member: "Employee",
      members: "Employees",
      memberPluralLower: "employees",
      adminTitle: "HR / Wellness admin",
    };
  }
  return {
    member: "Student",
    members: "Students",
    memberPluralLower: "students",
    adminTitle: "School admin",
  };
}

export function orgTypeLabel(type) {
  if (type === "corporate") return "Corporate";
  if (type === "school") return "School";
  return "Organization";
}
