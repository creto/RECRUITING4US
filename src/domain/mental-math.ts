export type MentalProblem = {
  key: string;
  prompt: string;
  expected: string;
};

const PRODUCTS: [number, number][] = [
  [186, 247],
  [314, 258],
  [409, 176],
  [523, 184],
  [267, 395],
  [138, 642],
  [751, 126],
  [482, 319],
  [205, 478],
  [364, 287],
  [918, 146],
  [273, 564],
];

const PERCENTS: [number, number][] = [
  [15, 480],
  [12, 250],
  [8, 625],
  [35, 240],
];

const QUOTIENTS: [number, number][] = [
  [744, 12],
  [936, 18],
  [825, 15],
  [672, 14],
];

/** Original arithmetic. Not an Optiver paper and not taken from a published test. */
export const MENTAL_MATH: MentalProblem[] = [
  ...PRODUCTS.map(([left, right], index) => ({
    key: `product-${index + 1}`,
    prompt: `What is ${left} × ${right}? Enter the digits only.`,
    expected: String(left * right),
  })),
  ...PERCENTS.map(([percent, whole], index) => ({
    key: `percent-${index + 1}`,
    prompt: `What is ${percent}% of ${whole}? Enter the digits only.`,
    expected: String((percent * whole) / 100),
  })),
  ...QUOTIENTS.map(([left, right], index) => ({
    key: `quotient-${index + 1}`,
    prompt: `What is ${left} ÷ ${right}? Enter the digits only.`,
    expected: String(left / right),
  })),
];

export const MENTAL_MATH_SECONDS = 15 * 60;
