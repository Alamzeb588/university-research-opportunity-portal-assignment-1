const requiredTextFields = [
  ["title", "Research title"],
  ["description", "Research description"],
  ["research_area", "Research area"],
  ["faculty_name", "Faculty member's name"],
  ["department", "Department"],
  ["required_skills", "Required skills"],
];

const textFieldLimits = {
  title: 255,
  research_area: 255,
  faculty_name: 255,
  department: 255,
  required_skills: 500,
};

function validateOpportunity(data) {
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return ["Request body must be a JSON object."];
  }

  for (const [field, label] of requiredTextFields) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      errors.push(`${label} is required.`);
    } else if (textFieldLimits[field] && data[field].trim().length > textFieldLimits[field]) {
      errors.push(`${label} must be ${textFieldLimits[field]} characters or fewer.`);
    }
  }

  if (!Number.isInteger(data.positions) || data.positions <= 0) {
    errors.push("Number of positions must be a positive whole number.");
  }

  if (typeof data.deadline !== "string" || !isValidDate(data.deadline)) {
    errors.push("Application deadline must be a valid date in YYYY-MM-DD format.");
  }

  if (data.status !== undefined && data.status !== "Open" && data.status !== "Closed") {
    errors.push('Status must be either "Open" or "Closed".');
  }

  return errors;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidId(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

module.exports = { isValidId, validateOpportunity };
