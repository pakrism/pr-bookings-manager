export function shadows() {
  const neutral = '16, 24, 40';
  return [
    'none',
    `0px 1px 2px rgba(${neutral}, 0.04)`,
    `0px 2px 4px rgba(${neutral}, 0.06)`,
    `0px 4px 8px rgba(${neutral}, 0.08)`,
    `0px 8px 16px rgba(${neutral}, 0.08)`,
    `0px 12px 24px rgba(${neutral}, 0.1)`,
    `0px 16px 32px rgba(${neutral}, 0.12)`,
    ...Array(18).fill(`0px 16px 32px rgba(${neutral}, 0.12)`),
  ];
}
