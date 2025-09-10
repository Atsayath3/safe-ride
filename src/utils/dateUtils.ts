/**
 * Safely converts Firestore Timestamp, Date, or string to Date object
 * @param dateValue - The date value from Firestore
 * @returns Date object
 */
export const safeDateConversion = (dateValue: any): Date => {
  if (!dateValue) {
    return new Date();
  }
  
  // Check if it's a Firestore Timestamp
  if (typeof dateValue.toDate === 'function') {
    return dateValue.toDate();
  }
  
  // Check if it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  // Check if it's a string
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }
  
  // Check if it's a number (timestamp)
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  // Default fallback
  console.warn('Unknown date format:', dateValue);
  return new Date();
};

/**
 * Safely converts multiple date fields in a document
 * @param data - Document data from Firestore
 * @param dateFields - Array of field names that contain dates
 * @returns Document data with converted dates
 */
export const convertDocumentDates = (data: any, dateFields: string[] = ['createdAt', 'updatedAt']) => {
  const converted = { ...data };
  
  dateFields.forEach(field => {
    if (data[field]) {
      converted[field] = safeDateConversion(data[field]);
    }
  });
  
  return converted;
};
