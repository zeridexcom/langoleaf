export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
  region: string
}

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', region: 'North America' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', region: 'Europe' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', region: 'North America' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', region: 'Oceania' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', region: 'Europe' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱', region: 'Europe' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪', region: 'Europe' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭', region: 'Europe' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪', region: 'Europe' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', region: 'Oceania' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', region: 'Asia' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪', region: 'Middle East' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', region: 'Asia' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', region: 'Asia' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', region: 'Asia' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', region: 'Asia' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', region: 'Asia' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', region: 'Asia' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', region: 'Asia' },
  { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', region: 'Asia' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳', region: 'Asia' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', region: 'Asia' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', region: 'Asia' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', region: 'Asia' },
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', region: 'Asia' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', region: 'Africa' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', region: 'Africa' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭', region: 'Africa' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', region: 'South America' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', region: 'North America' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷', region: 'South America' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱', region: 'South America' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴', region: 'South America' },
  { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪', region: 'South America' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', region: 'Europe' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', region: 'Europe' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹', region: 'Europe' },
  { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹', region: 'Europe' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪', region: 'Europe' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', flag: '🇩🇰', region: 'Europe' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮', region: 'Europe' },
  { code: 'NO', name: 'Norway', dialCode: '+47', flag: '🇳🇴', region: 'Europe' },
  { code: 'PL', name: 'Poland', dialCode: '+48', flag: '🇵🇱', region: 'Europe' },
  { code: 'CZ', name: 'Czech Republic', dialCode: '+420', flag: '🇨🇿', region: 'Europe' },
  { code: 'HU', name: 'Hungary', dialCode: '+36', flag: '🇭🇺', region: 'Europe' },
  { code: 'GR', name: 'Greece', dialCode: '+30', flag: '🇬🇷', region: 'Europe' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷', region: 'Europe' },
  { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', region: 'Europe' },
  { code: 'UA', name: 'Ukraine', dialCode: '+380', flag: '🇺🇦', region: 'Europe' },
  { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱', region: 'Middle East' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', region: 'Middle East' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', region: 'Middle East' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', region: 'Middle East' },
  { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', region: 'Middle East' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', region: 'Middle East' },
  { code: 'JO', name: 'Jordan', dialCode: '+962', flag: '🇯🇴', region: 'Middle East' },
  { code: 'LB', name: 'Lebanon', dialCode: '+961', flag: '🇱🇧', region: 'Middle East' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', region: 'Africa' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦', region: 'Africa' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳', region: 'Africa' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿', region: 'Africa' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹', region: 'Africa' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬', region: 'Africa' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿', region: 'Africa' },
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', flag: '🇿🇼', region: 'Africa' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲', region: 'Africa' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', flag: '🇲🇼', region: 'Africa' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿', region: 'Africa' },
  { code: 'BW', name: 'Botswana', dialCode: '+267', flag: '🇧🇼', region: 'Africa' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦', region: 'Africa' },
  { code: 'SZ', name: 'Eswatini', dialCode: '+268', flag: '🇸🇿', region: 'Africa' },
  { code: 'LS', name: 'Lesotho', dialCode: '+266', flag: '🇱🇸', region: 'Africa' },
]

export const POPULAR_DESTINATION_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'NL', 'IE', 'NZ', 'SG', 'AE'
]

export const POPULAR_SOURCE_COUNTRIES = [
  'IN', 'CN', 'NG', 'BD', 'PK', 'VN', 'PH', 'ID', 'MY', 'TH', 'LK', 'NP', 'KE', 'GH', 'ZA'
]

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code)
}

export function getCountryByName(name: string): Country | undefined {
  return COUNTRIES.find((country) => country.name.toLowerCase() === name.toLowerCase())
}

export function getCountriesByRegion(region: string): Country[] {
  return COUNTRIES.filter((country) => country.region === region)
}

export function getAllRegions(): string[] {
  return Array.from(new Set(COUNTRIES.map((country) => country.region)))
}

export function formatPhoneNumber(phone: string, countryCode: string): string {
  const country = getCountryByCode(countryCode)
  if (!country) return phone
  
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // If phone already starts with country code, return as is
  if (digits.startsWith(country.dialCode.replace('+', ''))) {
    return `+${digits}`
  }
  
  // Add country code
  return `${country.dialCode}${digits}`
}
