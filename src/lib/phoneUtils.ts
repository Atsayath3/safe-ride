// Sri Lankan phone number utilities

export const formatSriLankanPhone = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 94, remove it
  let number = digits.startsWith('94') ? digits.slice(2) : digits;
  
  // If starts with 0, remove it (local format)
  number = number.startsWith('0') ? number.slice(1) : number;
  
  // Add country code
  return `+94${number}`;
};

export const formatDisplayPhone = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 94, remove it
  let number = digits.startsWith('94') ? digits.slice(2) : digits;
  
  // If starts with 0, remove it (local format)
  number = number.startsWith('0') ? number.slice(1) : number;
  
  // Format as +94 XX XXX XXXX
  if (number.length >= 9) {
    return `+94 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5, 9)}`;
  } else if (number.length >= 5) {
    return `+94 ${number.slice(0, 2)} ${number.slice(2, 5)} ${number.slice(5)}`;
  } else if (number.length >= 2) {
    return `+94 ${number.slice(0, 2)} ${number.slice(2)}`;
  } else if (number.length > 0) {
    return `+94 ${number}`;
  }
  
  return '+94 ';
};

export const validateSriLankanPhone = (phone: string): boolean => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 94, remove it
  let number = digits.startsWith('94') ? digits.slice(2) : digits;
  
  // If starts with 0, remove it (local format)
  number = number.startsWith('0') ? number.slice(1) : number;
  
  // Sri Lankan mobile numbers are 9 digits and start with 7
  return number.length === 9 && number.startsWith('7');
};

export const cleanPhoneInput = (input: string): string => {
  // Remove all non-digits except +
  let cleaned = input.replace(/[^\\d+]/g, '');
  
  // If it starts with +94, keep it
  if (cleaned.startsWith('+94')) {
    return cleaned;
  }
  
  // If it starts with 94, add +
  if (cleaned.startsWith('94')) {
    return '+' + cleaned;
  }
  
  // If it starts with 0, remove it and add +94
  if (cleaned.startsWith('0')) {
    return '+94' + cleaned.slice(1);
  }
  
  // If it's just digits and starts with 7, add +94
  if (cleaned.startsWith('7')) {
    return '+94' + cleaned;
  }
  
  // Otherwise, add +94 prefix
  return '+94' + cleaned;
};
