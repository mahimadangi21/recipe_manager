export const categoryEmojis = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  dessert: '🍰',
  snack: '🍿',
  beverage: '☕',
  other: '🍴'
};

export const formatTime = (minutes) => {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
