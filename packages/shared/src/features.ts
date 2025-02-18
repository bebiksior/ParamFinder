export type AdditionalChecksResult = {
  handlesSpecialCharacters: boolean; // Sometimes servers can't handle raw special characters like [, ], *, +, etc.
  handlesEncodedSpecialCharacters: boolean;
};
