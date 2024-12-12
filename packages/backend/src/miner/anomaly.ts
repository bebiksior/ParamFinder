import { AnomalyResult, Parameter, Response, ResponseComparison } from "shared";

export function defineFactors(
  response1: Response,
  response2: Response,
  param: {
    key: string;
    value: string;
  },
  wordlist: string[],
  disableRedirects: boolean = false,
): ResponseComparison {
  const factors: ResponseComparison = {};

  if (!response1 || !response2) {
    return factors;
  }

  const body1 = response1.body || "";
  const body2 = response2.body || "";
  const headers1 = response1.headers || {};
  const headers2 = response2.headers || {};

  if (response1.status === response2.status) {
    factors.same_code = response1.status;
  }

  const keys1 = Object.keys(headers1).sort();
  const keys2 = Object.keys(headers2).sort();
  if (JSON.stringify(keys1) === JSON.stringify(keys2)) {
    factors.same_headers = keys1;
  }

  const redirect1 = getRedirectPath(response1);
  const redirect2 = getRedirectPath(response2);
  if (disableRedirects) {
    if (redirect1 === redirect2) {
      factors.same_redirect = redirect1;
    } else {
      factors.same_redirect = "";
    }
  } else {
    if (redirect1 === redirect2) {
      factors.same_redirect = redirect1;
    } else {
      factors.same_redirect = "";
    }
  }

  if (body1 === body2) {
    factors.same_body = body1;
  } else {
    const lineCount1 = (body1.match(/\n/g) || []).length;
    const lineCount2 = (body2.match(/\n/g) || []).length;
    if (lineCount1 === lineCount2) {
      factors.lines_num = lineCount1;
    }

    const pt1 = removeHtmlTags(body1);
    const pt2 = removeHtmlTags(body2);
    if (!factors.same_body && !factors.lines_num && pt1 === pt2) {
      factors.same_plaintext = pt1;
    }

    if (
      !factors.same_body &&
      !factors.same_plaintext &&
      factors.lines_num !== null &&
      factors.lines_num !== undefined
    ) {
      const diff = diff_map(body1, body2);
      if (diff.length > 0) {
        factors.lines_diff = diff;
      }
    }
  }

  if (!body2.includes(param.key)) {
    const foundWords = wordlist.filter((w) => body2.includes(w));
    if (foundWords.length > 0) {
      factors.param_missing = foundWords;
    } else {
      factors.param_missing = [];
    }
  }

  const countValue1 = (
    body1.match(new RegExp(escapeRegExp(param.value), "g")) || []
  ).length;
  const countValue2 = (
    body2.match(new RegExp(escapeRegExp(param.value), "g")) || []
  ).length;

  if (countValue1 === countValue2) {
    factors.same_value_count = countValue1;
  } else {
    factors.same_value_count = null;
  }

  return factors;
}

export function analyzeResponse(
  response: Response,
  factors: ResponseComparison,
  params: Parameter[],
  disableRedirects: boolean = false,
): AnomalyResult | null {
  if (!response) return null;

  const body = response.body || "";
  const keys = response.headers ? Object.keys(response.headers).sort() : [];

  if (factors.same_code !== null && factors.same_code !== undefined) {
    if (response.status !== factors.same_code) {
      return { anomaly: "http code", rule: "same_code" };
    }
  }

  if (factors.same_headers !== null && factors.same_headers !== undefined) {
    if (JSON.stringify(keys) !== JSON.stringify(factors.same_headers)) {
      return { anomaly: "http headers", rule: "same_headers" };
    }
  }

  if (factors.same_redirect !== null && factors.same_redirect !== undefined) {
    const redirectPath = getRedirectPath(response);
    if (disableRedirects) {
      if (redirectPath !== factors.same_redirect) {
        return { anomaly: "redirection", rule: "same_redirect" };
      }
    } else {
      if (
        redirectPath !== factors.same_redirect &&
        response.headers &&
        response.headers["Location"]
      ) {
        return { anomaly: "redirection", rule: "same_redirect" };
      }
    }
  }

  if (factors.same_body !== null && factors.same_body !== undefined) {
    if (body !== factors.same_body) {
      return { anomaly: "body length", rule: "same_body" };
    }
  }

  if (factors.lines_num !== null && factors.lines_num !== undefined) {
    const lineCount = (body.match(/\n/g) || []).length;
    if (lineCount !== factors.lines_num) {
      return { anomaly: "number of lines", rule: "lines_num" };
    }
  }

  if (factors.same_plaintext !== null && factors.same_plaintext !== undefined) {
    const pt = removeHtmlTags(body);
    if (pt !== factors.same_plaintext) {
      return { anomaly: "text length", rule: "same_plaintext" };
    }
  }

  if (factors.lines_diff !== null && factors.lines_diff !== undefined) {
    for (const line of factors.lines_diff) {
      if (!body.includes(line)) {
        return { anomaly: "lines", rule: "lines_diff" };
      }
    }
  }

  for (const param of params) {
    const paramName = param.name;
    const paramValue = param.value;

    if (factors.param_missing !== null && factors.param_missing !== undefined) {
      if (
        paramName &&
        paramName.length > 4 &&
        !factors.param_missing.includes(paramName)
      ) {
        const re = new RegExp(`[\'"\\s]${escapeRegExp(paramName)}[\'"\\s]`);
        if (re.test(body)) {
          return { anomaly: "param name reflection", rule: "param_missing" };
        }
      }
    }

    if (
      paramValue &&
      factors.same_value_count !== null &&
      factors.same_value_count !== undefined
    ) {
      const currentCount = (
        body.match(new RegExp(escapeRegExp(paramValue), "g")) || []
      ).length;
      if (currentCount !== factors.same_value_count) {
        return {
          anomaly: "param value reflection count changed",
          rule: "same_value_count",
        };
      }
    }
  }

  return null;
}

function removeHtmlTags(text: string): string {
  return text.replace(/<\/?[^>]+(>|$)/g, "");
}

function diff_map(body1: string, body2: string): string[] {
  const lines1 = body1.split("\n");
  const lines2 = body2.split("\n");
  const sig: string[] = [];
  for (let i = 0; i < Math.min(lines1.length, lines2.length); i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];
    if (line1 !== undefined && line2 !== undefined && line1 === line2) {
      sig.push(line1);
    }
  }
  return sig;
}

function getRedirectPath(response: Response): string {
  const loc = response.headers?.["Location"]?.[0] || "";
  const match = loc.match(/https?:\/\/[^/]+(\/.*)/);
  return (match ? match[1] : "/") || "/";
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
