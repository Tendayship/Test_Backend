export const validateKoreanAddress = (address: string): boolean => {
  const patterns = [
    /^.+시\s.+구\s.+동\s.+$/,          // 시/구/동 패턴
    /^.+도\s.+시\s.+동\s.+$/,          // 도/시/동 패턴  
    /^.+도\s.+군\s.+면\s.+$/,          // 도/군/면 패턴
  ];
  
  return patterns.some(pattern => pattern.test(address));
};

export const validatePostalCode = (code: string): boolean => {
  return /^\d{5}$/.test(code);
};

export const formatPostalCode = (code: string): string => {
  return code.replace(/\D/g, '').slice(0, 5);
};
