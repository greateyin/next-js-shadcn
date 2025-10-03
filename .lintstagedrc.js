// @ts-check

/** @type {import('lint-staged').Config} */
const config = {
  '*.{js,jsx,ts,tsx}': ['eslint --cache --fix'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
};

export default config;
